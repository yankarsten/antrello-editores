import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DEFAULT_STATUS, isProjectStatus } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const deadlineRaw = typeof body?.deadline === "string" ? body.deadline : "";
  const assignedEditorId = typeof body?.assignedEditorId === "string" && body.assignedEditorId ? body.assignedEditorId : null;
  // Creating from a board column seeds that column's status.
  const status = typeof body?.status === "string" && isProjectStatus(body.status) ? body.status : DEFAULT_STATUS;

  if (!title) return NextResponse.json({ error: "Informe o título do projeto." }, { status: 400 });
  const deadline = new Date(`${deadlineRaw}T18:00:00`);
  if (!deadlineRaw || isNaN(deadline.getTime())) {
    return NextResponse.json({ error: "Informe um prazo válido." }, { status: 400 });
  }

  if (assignedEditorId) {
    const editor = await db.user.findFirst({ where: { id: assignedEditorId, role: "editor" } });
    if (!editor) return NextResponse.json({ error: "Editor não encontrado." }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      title,
      description: description || null,
      notes: notes || null,
      deadline,
      status,
      assignedEditorId,
      createdById: session.userId,
    },
  });

  return NextResponse.json({ id: project.id }, { status: 201 });
}
