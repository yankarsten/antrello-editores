import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAllowedVideo } from "@/lib/media";
import { deliveryFileName, deliveryLabel } from "@/lib/delivery";
import { saveChunk } from "@/lib/storage";
import { readChunkMeta } from "@/lib/upload";

// Chunked upload of a project's final video (see source-videos route for the
// chunking approach). The assigned editor delivers their own project; an admin
// may upload a final video to any project.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  const isAdmin = session.role === "admin";
  if (!project || (!isAdmin && project.assignedEditorId !== session.userId)) {
    return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
  }

  const uploadedName = decodeURIComponent(request.headers.get("x-file-name") ?? "").trim();
  if (!uploadedName || !isAllowedVideo(uploadedName)) {
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
    result = await saveChunk({ uploadId, chunkIndex, totalChunks, originalName: uploadedName, body: request.body });
  } catch {
    return NextResponse.json({ error: "Falha ao gravar o arquivo. Tente novamente." }, { status: 400 });
  }
  if (!result.done) {
    return NextResponse.json({ received: chunkIndex }, { status: 200 });
  }

  // The name the uploader's export happened to carry is dropped: deliveries are
  // named after the project and numbered in the order they arrive, so the whole
  // revision history of a video reads as one sequence.
  const revision = (await db.deliveryVideo.count({ where: { projectId: id } })) + 1;

  const video = await db.deliveryVideo.create({
    data: {
      projectId: id,
      uploadedById: session.userId,
      label: deliveryLabel(revision),
      fileName: deliveryFileName(project.title, revision, uploadedName),
      storedName: result.storedName!,
      size: result.size!,
    },
  });

  return NextResponse.json({ id: video.id }, { status: 201 });
}
