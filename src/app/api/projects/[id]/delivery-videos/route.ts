import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAllowedVideo, saveChunk } from "@/lib/storage";
import { readChunkMeta } from "@/lib/upload";

// Chunked upload of an editor's delivery video (see source-videos route for the
// chunking approach). Only the assigned editor can deliver.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "editor") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.assignedEditorId !== session.userId) {
    return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const fileName = decodeURIComponent(request.headers.get("x-file-name") ?? "").trim();
  const label = decodeURIComponent(request.headers.get("x-label") ?? "").trim() || "Vídeo Final";
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

  const video = await db.deliveryVideo.create({
    data: {
      projectId: id,
      uploadedById: session.userId,
      label: label.slice(0, 120),
      fileName,
      storedName: result.storedName!,
      size: result.size!,
    },
  });

  return NextResponse.json({ id: video.id }, { status: 201 });
}
