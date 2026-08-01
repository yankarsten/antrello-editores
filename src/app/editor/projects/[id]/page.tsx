import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import VideoList, { type VideoItem } from "@/components/VideoList";
import DeliveryUpload from "./DeliveryUpload";

export const dynamic = "force-dynamic";

export default async function EditorProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      sourceVideos: { orderBy: { uploadedAt: "asc" } },
      deliveryVideos: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
    },
  });
  // Editors only ever see their own projects — anything else 404s.
  if (!project || project.assignedEditorId !== session.userId) notFound();

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

  const suggestedLabel =
    deliveryItems.length === 0 ? "Vídeo Final" : `Vídeo Final R${deliveryItems.length + 1}`;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold text-zinc-900">{project.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        <DeadlineBadge deadline={project.deadline} status={project.status} />
      </div>

      {project.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{project.description}</p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-800">
          Vídeos brutos{" "}
          <span className="text-sm font-normal text-zinc-400">({sourceItems.length})</span>
        </h2>
        <VideoList
          videos={sourceItems}
          emptyText="A administração ainda não enviou os vídeos brutos deste projeto."
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-800">Enviar entrega</h2>
        <div className="card p-5">
          <DeliveryUpload projectId={project.id} suggestedLabel={suggestedLabel} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-800">
          Minhas entregas{" "}
          <span className="text-sm font-normal text-zinc-400">({deliveryItems.length})</span>
        </h2>
        <VideoList
          videos={deliveryItems}
          emptyText="Você ainda não enviou nenhuma entrega para este projeto."
        />
      </section>
    </div>
  );
}
