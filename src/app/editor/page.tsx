import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-zinc-900">Meus projetos</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Projetos atribuídos a você, ordenados pelo prazo mais próximo.
      </p>

      {projects.length === 0 ? (
        <div className="card mt-6 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Nenhum projeto atribuído a você ainda.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Assim que a administração atribuir um projeto, ele aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/editor/projects/${project.id}`}
                className="card block p-4 transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-800">{project.title}</h2>
                  <StatusBadge status={project.status} />
                </div>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{project.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
