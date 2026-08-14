import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isProjectStatus } from "@/lib/constants";
import { parseDeadlineInput } from "@/lib/format";
import { deleteStoredFile } from "@/lib/storage";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const data: {
    status?: string;
    assignedEditorId?: string | null;
    description?: string | null;
    notes?: string | null;
    deadline?: Date | null;
  } = {};

  if (body && "status" in body) {
    if (typeof body.status !== "string" || !isProjectStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body && "assignedEditorId" in body) {
    if (body.assignedEditorId === null || body.assignedEditorId === "") {
      data.assignedEditorId = null;
    } else if (typeof body.assignedEditorId === "string") {
      const editor = await db.user.findFirst({ where: { id: body.assignedEditorId, role: "editor" } });
      if (!editor) return NextResponse.json({ error: "Editor não encontrado." }, { status: 400 });
      data.assignedEditorId = editor.id;
    } else {
      return NextResponse.json({ error: "Editor inválido." }, { status: 400 });
    }
  }

  if (body && "deadline" in body) {
    // null/"" clears the prazo — a video is allowed to have none.
    if (body.deadline === null || body.deadline === "") {
      data.deadline = null;
    } else {
      const deadline = parseDeadlineInput(body.deadline);
      if (!deadline) return NextResponse.json({ error: "Informe um prazo válido." }, { status: 400 });
      data.deadline = deadline;
    }
  }

  if (body && "description" in body) {
    if (body.description === null) {
      data.description = null;
    } else if (typeof body.description === "string") {
      data.description = body.description.trim() || null;
    } else {
      return NextResponse.json({ error: "Descrição inválida." }, { status: 400 });
    }
  }

  if (body && "notes" in body) {
    if (body.notes === null) {
      data.notes = null;
    } else if (typeof body.notes === "string") {
      data.notes = body.notes.trim() || null;
    } else {
      return NextResponse.json({ error: "Observações inválidas." }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const updated = await db.project.update({ where: { id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { sourceVideos: true, deliveryVideos: true, attachments: true },
  });
  if (!project) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });

  await db.project.delete({ where: { id } });
  for (const file of [...project.sourceVideos, ...project.deliveryVideos, ...project.attachments]) {
    deleteStoredFile(file.storedName);
  }

  return NextResponse.json({ ok: true });
}
