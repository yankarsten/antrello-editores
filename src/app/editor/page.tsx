import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isDoneStatus } from "@/lib/constants";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

interface EditorProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: Date;
  _count: { sourceVideos: number; deliveryVideos: number };
}

export default async function EditorDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const projects = await db.project.findMany({
    where: { assignedEditorId: session.userId },
    include: {
      _count: { select: { sourceVideos: true, deliveryVideos: true } },
    },
    orderBy: { deadline: "asc" },
  });

  // Finished work never competes for attention with the deadline-sorted
  // active list: it always sits below the divider, newest deadline last.
  const active = projects.filter((p) => !isDoneStatus(p.status));
  const done = projects.filter((p) => isDoneStatus(p.status));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Meus vídeos"
        subtitle="Vídeos atribuídos a você, ordenados pelo prazo mais próximo."
      />

      {projects.length === 0 ? (
        <div className="card-empty !py-12">
          <p className="text-base font-medium text-ink">Nenhum vídeo atribuído a você ainda.</p>
          <p className="mt-2 text-sm text-ink/70">
            Assim que a administração atribuir um vídeo, ele aparece aqui.
          </p>
        </div>
      ) : (
        <>
          {active.length === 0 ? (
            <p className="card-empty">Nenhum vídeo em edição no momento.</p>
          ) : (
            <ul className="space-y-4">
              {active.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <>
              <div className="my-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink" />
                <span className="chip bg-ink text-white">Finalizados</span>
                <span className="h-px flex-1 bg-ink" />
              </div>
              <ul className="space-y-4">
                {done.map((project) => (
                  <li key={project.id}>
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: EditorProject }) {
  return (
    <Link
      href={`/editor/projects/${project.id}`}
      className="card block p-6 transition hover:shadow-hard"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-medium text-ink">{project.title}</h2>
        <StatusBadge status={project.status} />
      </div>
      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-ink/70">{project.description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/60">
        <DeadlineBadge deadline={project.deadline} status={project.status} />
        <span>
          {project._count.sourceVideos}{" "}
          {project._count.sourceVideos === 1 ? "vídeo bruto" : "vídeos brutos"}
        </span>
        <span>·</span>
        <span>
          {project._count.deliveryVideos}{" "}
          {project._count.deliveryVideos === 1 ? "entrega" : "entregas"}
        </span>
      </div>
    </Link>
  );
}
