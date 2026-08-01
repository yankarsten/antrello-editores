import { db } from "@/lib/db";
import KanbanBoard, { type BoardProject } from "@/components/KanbanBoard";

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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Quadro de projetos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Arraste os cartões para atualizar o status de cada projeto.
          </p>
        </div>
      </div>
      <KanbanBoard initialProjects={boardProjects} />
    </div>
  );
}
