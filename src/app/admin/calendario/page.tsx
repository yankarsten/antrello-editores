import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dayKey } from "@/lib/format";
import { listEditorOptions } from "@/lib/editors";
import ProjectCalendar, { type CalendarProject } from "@/components/ProjectCalendar";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await getSession();
  const [projects, editors] = await Promise.all([
    db.project.findMany({
      include: {
        assignedEditor: { select: { id: true, name: true } },
        _count: { select: { deliveryVideos: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    listEditorOptions(),
  ]);

  const calendarProjects: CalendarProject[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    day: dayKey(p.deadline),
    editorId: p.assignedEditor?.id ?? null,
    editorName: p.assignedEditor?.name ?? null,
    deliveryCount: p._count.deliveryVideos,
  }));

  return (
    <div>
      <PageHeader
        title="Calendário"
        subtitle="Entregas de todos os vídeos por data de prazo. Clique em um dia para ver os detalhes ou use o + do dia para criar um vídeo com esse prazo."
      />
      {/* todayKey comes from the server so the "hoje" highlight can't drift
          between server and client render. */}
      <ProjectCalendar
        projects={calendarProjects}
        editors={editors}
        todayKey={dayKey(new Date())}
        canCreate={session?.role === "admin"}
      />
    </div>
  );
}
