import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import VideoList, { type VideoItem } from "@/components/VideoList";
import { SectionHeading } from "@/components/PageHeader";
import ProjectControls from "./ProjectControls";
import ProjectNotes from "./ProjectNotes";
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
    uploaderName: v.uploadedBy?.name ?? "Editor removido",
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-medium leading-tight">
        <span className="pill">{project.title}</span>
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        <DeadlineBadge deadline={project.deadline} status={project.status} />
      </div>

      {project.description && (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{project.description}</p>
      )}

      <ProjectNotes projectId={project.id} initialNotes={project.notes ?? ""} />

      <div className="card-mist mt-6 p-6">
        <SectionHeading>Gerenciar projeto</SectionHeading>
        <ProjectControls
          projectId={project.id}
          currentStatus={project.status}
          currentEditorId={project.assignedEditor?.id ?? ""}
          editors={editors}
        />
      </div>

      <section className="mt-10">
        <div className="mb-4">
          <SectionHeading count={sourceItems.length}>Vídeos brutos</SectionHeading>
        </div>
        <VideoList videos={sourceItems} emptyText="Nenhum vídeo bruto enviado ainda." />
        <div className="mt-4">
          <AddSourceVideos projectId={project.id} />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <SectionHeading count={deliveryItems.length}>Entregas do editor</SectionHeading>
        </div>
        <VideoList
          videos={deliveryItems}
          emptyText="Nenhuma entrega ainda. Assim que o editor enviar um vídeo final, ele aparece aqui."
        />
      </section>
    </div>
  );
}
