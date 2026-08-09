import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contentTypeFor } from "@/lib/media";
import { createReadStream, storedFileSize } from "@/lib/storage";

const TYPES = ["source", "delivery", "attachment"] as const;
type FileType = (typeof TYPES)[number];

function isFileType(value: string): value is FileType {
  return (TYPES as readonly string[]).includes(value);
}

/** The three tables share the columns this route needs; pick the right one. */
function findFile(type: FileType, id: string) {
  if (type === "source") {
    return db.sourceVideo.findUnique({ where: { id }, include: { project: true } });
  }
  if (type === "delivery") {
    return db.deliveryVideo.findUnique({ where: { id }, include: { project: true } });
  }
  return db.attachment.findUnique({ where: { id }, include: { project: true } });
}

// Authenticated file delivery with HTTP Range support so <video> seeking
// works. Streams from local disk — this route (plus lib/storage) is what gets
// replaced by signed object-storage URLs (S3/R2/GCS) later.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { type, id } = await params;
  if (!isFileType(type)) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const file = await findFile(type, id);
  if (!file) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const isAdmin = session.role === "admin";
  const isAssignedEditor = file.project.assignedEditorId === session.userId;
  if (!isAdmin && !isAssignedEditor) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const totalSize = storedFileSize(file.storedName);
  if (totalSize === null) {
    return NextResponse.json({ error: "Arquivo não encontrado no armazenamento." }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": contentTypeFor(file.fileName),
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    // Attachments are shown inline, so never let the browser guess a type we
    // did not send (an "image" that sniffs as HTML would run on our origin).
    "X-Content-Type-Options": "nosniff",
  });
  if (request.nextUrl.searchParams.get("download") === "1") {
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`
    );
  }

  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;

  if (match && (match[1] || match[2])) {
    const start = match[1] ? parseInt(match[1], 10) : Math.max(0, totalSize - parseInt(match[2], 10));
    const end = match[1] && match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;
    if (start >= totalSize || start > end) {
      headers.set("Content-Range", `bytes */${totalSize}`);
      return new NextResponse(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(file.storedName, start, end)) as ReadableStream;
    return new NextResponse(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(totalSize));
  const stream = Readable.toWeb(createReadStream(file.storedName)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
