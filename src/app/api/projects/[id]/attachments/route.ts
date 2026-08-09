import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ATTACHMENT_EXTENSIONS, formatExtensions, isAllowedAttachment, mediaKind } from "@/lib/media";
import { saveChunk } from "@/lib/storage";
import { readChunkMeta } from "@/lib/upload";

// Chunked upload of an "anexo" — reference material for a video (see the
// source-videos route for the chunking approach). Admin only, and unlike the
// raw footage it also accepts images.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });

  const fileName = decodeURIComponent(request.headers.get("x-file-name") ?? "").trim();
  if (!fileName || !isAllowedAttachment(fileName)) {
    return NextResponse.json(
      { error: `Formato não suportado. Envie arquivos ${formatExtensions(ATTACHMENT_EXTENSIONS)}.` },
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

  const attachment = await db.attachment.create({
    data: {
      projectId: id,
      fileName,
      kind: mediaKind(fileName),
      storedName: result.storedName!,
      size: result.size!,
    },
  });

  return NextResponse.json({ id: attachment.id }, { status: 201 });
}
