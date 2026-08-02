import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";
import ProjectCalendar, {
  type CalendarEditor,
  type CalendarProject,
} from "@/components/ProjectCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [projects, editors] = await Promise.all([
    db.project.findMany({
      include: {
        assignedEditor: { select: { id: true, name: true } },
        _count: { select: { deliveryVideos: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    db.user.findMany({
      where: { role: "editor" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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

  const calendarEditors: CalendarEditor[] = editors;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-zinc-900">Calendário</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Entregas de todos os projetos por data de prazo. Clique em um dia para ver os detalhes.
        </p>
      </div>
      {/* todayKey comes from the server so the "hoje" highlight can't drift
          between server and client render. */}
      <ProjectCalendar
        projects={calendarProjects}
        editors={calendarEditors}
        todayKey={dayKey(new Date())}
      />
    </div>
  );
}
