import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import path from "node:path";
import { ZipFile } from "yazl";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { storedFilePath, storedFileSize } from "@/lib/storage";

/** Safe entry name inside the archive: no directories, no control characters. */
function entryName(fileName: string): string {
  const base = Array.from(path.basename(fileName.replace(/\\/g, "/")))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim();
  return base || "video";
}

/** "a.mp4" twice becomes "a.mp4" and "a (2).mp4" — extractors dislike duplicates. */
function dedupe(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let n = 2;
  while (taken.has(`${stem} (${n})${ext}`)) n++;
  const unique = `${stem} (${n})${ext}`;
  taken.add(unique);
  return unique;
}

function zipFileName(title: string): string {
  // NFD splits accented letters into base + combining mark, and the mark is then
  // swallowed by the non-alphanumeric replacement: "Café" -> "cafe".
  const slug = title
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug || "video"}-brutos.zip`;
}

// Bundles every raw video of a project into a single .zip download. Entries are
// stored uncompressed (compress: false) — video files are already compressed, so
// deflating them burns CPU for ~0 gain and would also cost us the Content-Length.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { sourceVideos: { orderBy: { uploadedAt: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });

  const isAdmin = session.role === "admin";
  const isAssignedEditor = project.assignedEditorId === session.userId;
  if (!isAdmin && !isAssignedEditor) {
    return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
  }

  // Skip records whose file vanished from storage — one missing file should not
  // fail the whole download.
  const available = project.sourceVideos.filter((v) => storedFileSize(v.storedName) !== null);
  if (available.length === 0) {
    return NextResponse.json({ error: "Nenhum vídeo bruto disponível para download." }, { status: 404 });
  }

  const zip = new ZipFile();
  const taken = new Set<string>();
  for (const video of available) {
    zip.addFile(storedFilePath(video.storedName), dedupe(entryName(video.fileName), taken), {
      compress: false,
      mtime: video.uploadedAt,
    });
  }

  // With stored (uncompressed) entries yazl can tell us the exact archive size
  // up front, which gives the browser a real progress bar on multi-GB bundles.
  // The typings model the callback as taking no arguments; it does receive the size.
  const totalSize = await new Promise<number>((resolve, reject) => {
    zip.on("error", reject);
    zip.end({} as never, ((size: number) => resolve(size)) as () => void);
  }).catch(() => -1);

  const headers = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipFileName(project.title))}`,
    "Cache-Control": "private, no-store",
  });
  if (totalSize >= 0) headers.set("Content-Length", String(totalSize));

  return new NextResponse(Readable.toWeb(zip.outputStream as Readable) as ReadableStream, {
    status: 200,
    headers,
  });
}
