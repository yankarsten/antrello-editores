import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAllowedVideo, saveChunk } from "@/lib/storage";
import { readChunkMeta } from "@/lib/upload";

// Chunked raw-body upload: the client sends the file as a sequence of <100 MB
// parts (so each request fits under Cloudflare's proxy body limit), keyed by
// the x-upload-id header. The DB row is created only on the final chunk.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });

  const fileName = decodeURIComponent(request.headers.get("x-file-name") ?? "").trim();
  if (!fileName || !isAllowedVideo(fileName)) {
    return NextResponse.json(
      { error: "Formato não suportado. Envie arquivos mp4, mov, mkv, webm ou avi." },
      { status: 400 }
    );
  }
  if (!request.body) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }

  const { uploadId, chunkIndex, totalChunks } = readChunkMeta(request);
  let result;
  try {
    result = await saveChunk({ uploadId, chunkIndex, totalChunks, originalName: fileName, body: request.body });
  } catch {
    return NextResponse.json({ error: "Falha ao gravar o arquivo. Tente novamente." }, { status: 400 });
  }
  if (!result.done) {
    return NextResponse.json({ received: chunkIndex }, { status: 200 });
  }

  const video = await db.sourceVideo.create({
    data: { projectId: id, fileName, storedName: result.storedName!, size: result.size! },
  });

  return NextResponse.json({ id: video.id }, { status: 201 });
}
