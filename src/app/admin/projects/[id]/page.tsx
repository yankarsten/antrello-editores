import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import VideoList, { type VideoItem } from "@/components/VideoList";
import ProjectControls from "./ProjectControls";
import AddSourceVideos from "./AddSourceVideos";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      assignedEditor: { select: { id: true, name: true } },
      sourceVideos: { orderBy: { uploadedAt: "asc" } },
      deliveryVideos: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
    },
  });
  if (!project) notFound();

  const editors = await db.user.findMany({
    where: { role: "editor" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const sourceItems: VideoItem[] = project.sourceVideos.map((v) => ({
    id: v.id,
    type: "source",
    fileName: v.fileName,
    size: v.size,
    uploadedAt: v.uploadedAt.toISOString(),
  }));

  const deliveryItems: VideoItem[] = project.deliveryVideos.map((v) => ({
    id: v.id,
    type: "delivery",
    fileName: v.fileName,
    size: v.size,
    uploadedAt: v.uploadedAt.toISOString(),
    label: v.label,
    uploaderName: v.uploadedBy.name,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <DeadlineBadge deadline={project.deadline} status={project.status} />
          </div>
        </div>
      </div>

      {project.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{project.description}</p>
      )}

      <div className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-zinc-700">Gerenciar projeto</h2>
        <ProjectControls
          projectId={project.id}
          currentStatus={project.status}
          currentEditorId={project.assignedEditor?.id ?? ""}
          editors={editors}
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Vídeos brutos{" "}
            <span className="text-sm font-normal text-zinc-400">({sourceItems.length})</span>
          </h2>
        </div>
        <VideoList videos={sourceItems} emptyText="Nenhum vídeo bruto enviado ainda." />
        <div className="mt-3">
          <AddSourceVideos projectId={project.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-800">
          Entregas do editor{" "}
          <span className="text-sm font-normal text-zinc-400">({deliveryItems.length})</span>
        </h2>
        <VideoList
          videos={deliveryItems}
          emptyText="Nenhuma entrega ainda. Assim que o editor enviar um vídeo final, ele aparece aqui."
        />
      </section>
    </div>
  );
}
