import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DEFAULT_STATUS, STATUS_LABELS } from "@/lib/constants";
import { listEditorOptions } from "@/lib/editors";
import KanbanBoard, { type BoardProject } from "@/components/KanbanBoard";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const session = await getSession();
  const [projects, editors] = await Promise.all([
    db.project.findMany({
      include: {
        assignedEditor: { select: { name: true } },
        _count: { select: { deliveryVideos: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    listEditorOptions(),
  ]);

  const boardProjects: BoardProject[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    deadline: p.deadline.toISOString(),
    editorName: p.assignedEditor?.name ?? null,
    deliveryCount: p._count.deliveryVideos,
  }));

  return (
    <div>
      <PageHeader
        title="Quadro de vídeos"
        subtitle={`Clique em um cartão para abrir o vídeo ou use a alça à direita dele para arrastá-lo entre as colunas. Use o + em ${STATUS_LABELS[DEFAULT_STATUS]} para criar um vídeo.`}
      />
      <KanbanBoard
        initialProjects={boardProjects}
        editors={editors}
        canCreate={session?.role === "admin"}
      />
    </div>
  );
}
