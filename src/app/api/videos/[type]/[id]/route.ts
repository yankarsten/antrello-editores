import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { contentTypeFor, createReadStream, storedFileSize } from "@/lib/storage";

// Authenticated video delivery with HTTP Range support so <video> seeking
// works. Streams from local disk — this route (plus lib/storage) is what gets
// replaced by signed object-storage URLs (S3/R2/GCS) later.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { type, id } = await params;
  if (type !== "source" && type !== "delivery") {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const video =
    type === "source"
      ? await db.sourceVideo.findUnique({ where: { id }, include: { project: true } })
      : await db.deliveryVideo.findUnique({ where: { id }, include: { project: true } });

  if (!video) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const isAdmin = session.role === "admin";
  const isAssignedEditor = video.project.assignedEditorId === session.userId;
  if (!isAdmin && !isAssignedEditor) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const totalSize = storedFileSize(video.storedName);
  if (totalSize === null) {
    return NextResponse.json({ error: "Arquivo não encontrado no armazenamento." }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": contentTypeFor(video.fileName),
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (request.nextUrl.searchParams.get("download") === "1") {
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(video.fileName)}`
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
    const stream = Readable.toWeb(createReadStream(video.storedName, start, end)) as ReadableStream;
    return new NextResponse(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(totalSize));
  const stream = Readable.toWeb(createReadStream(video.storedName)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
