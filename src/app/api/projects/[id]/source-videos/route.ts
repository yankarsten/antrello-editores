import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAllowedVideo, saveStream } from "@/lib/storage";

// Raw-body streaming upload: one request per file, filename in the
// x-file-name header. Avoids formData(), which would buffer the whole
// (potentially multi-GB) file in memory.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

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

  const { storedName, size } = await saveStream(request.body, fileName);
  const video = await db.sourceVideo.create({
    data: { projectId: id, fileName, storedName, size },
  });

  return NextResponse.json({ id: video.id }, { status: 201 });
}
