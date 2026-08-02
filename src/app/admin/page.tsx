import { db } from "@/lib/db";
import KanbanBoard, { type BoardProject } from "@/components/KanbanBoard";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const projects = await db.project.findMany({
    include: {
      assignedEditor: { select: { name: true } },
      _count: { select: { deliveryVideos: true } },
    },
    orderBy: { deadline: "asc" },
  });

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
        title="Quadro de projetos"
        subtitle="Arraste os cartões para atualizar o status de cada projeto."
      />
      <KanbanBoard initialProjects={boardProjects} />
    </div>
  );
}
