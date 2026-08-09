import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";
import type { MediaKind } from "@/lib/media";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import FileList, { type FileItem } from "@/components/FileList";
import SectionNav from "@/components/SectionNav";
import { SectionHeading } from "@/components/PageHeader";
import ProjectControls from "./ProjectControls";
import ProjectNotes from "./ProjectNotes";
import AddSourceVideos from "./AddSourceVideos";
import AddAttachments from "./AddAttachments";

export const dynamic = "force-dynamic";

/** Rows shown before a long list collapses behind "Mostrar todos". */
const PREVIEW_ROWS = 4;

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      assignedEditor: { select: { id: true, name: true } },
      sourceVideos: { orderBy: { uploadedAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "asc" } },
      deliveryVideos: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
    },
  });
  if (!project) notFound();

  const editors = await db.user.findMany({
    where: { role: "editor" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const sourceItems: FileItem[] = project.sourceVideos.map((v) => ({
    id: v.id,
    type: "source",
    fileName: v.fileName,
    size: v.size,
    uploadedAt: v.uploadedAt.toISOString(),
  }));

  const attachmentItems: FileItem[] = project.attachments.map((a) => ({
    id: a.id,
    type: "attachment",
    kind: a.kind as MediaKind,
    fileName: a.fileName,
    size: a.size,
    uploadedAt: a.uploadedAt.toISOString(),
  }));

  const deliveryItems: FileItem[] = project.deliveryVideos.map((v) => ({
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

      <SectionNav
        sections={[
          { id: "brutos", label: "Vídeos brutos", count: sourceItems.length },
          { id: "anexos", label: "Anexos", count: attachmentItems.length },
          { id: "entregas", label: "Entregas do editor", count: deliveryItems.length },
        ]}
      />

      {project.description && (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{project.description}</p>
      )}

      <ProjectNotes projectId={project.id} initialNotes={project.notes ?? ""} />

      <div className="card-mist mt-6 p-6">
        <SectionHeading>Gerenciar vídeo</SectionHeading>
        <ProjectControls
          projectId={project.id}
          currentStatus={project.status}
          currentEditorId={project.assignedEditor?.id ?? ""}
          currentDeadline={dayKey(project.deadline)}
          editors={editors}
        />
      </div>

      <section id="brutos" className="mt-10 scroll-mt-32">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SectionHeading count={sourceItems.length}>Vídeos brutos</SectionHeading>
          {sourceItems.length > 0 && (
            <a
              href={`/api/projects/${project.id}/source-videos/zip`}
              className="btn-accent !px-4 !py-2 text-sm"
              download
            >
              Baixar tudo (.zip)
            </a>
          )}
        </div>
        <FileList
          files={sourceItems}
          maxVisible={PREVIEW_ROWS}
          emptyText="Nenhum vídeo bruto enviado ainda."
        />
        <div className="mt-4">
          <AddSourceVideos projectId={project.id} />
        </div>
      </section>

      <section id="anexos" className="mt-10 scroll-mt-32">
        <div className="mb-4">
          <SectionHeading count={attachmentItems.length}>Anexos</SectionHeading>
          <p className="mt-1 text-sm text-ink/60">
            Material de apoio para o editor — vídeos de referência, thumbnails, logos, prints.
          </p>
        </div>
        <FileList
          files={attachmentItems}
          maxVisible={PREVIEW_ROWS}
          emptyText="Nenhum anexo enviado ainda."
        />
        <div className="mt-4">
          <AddAttachments projectId={project.id} />
        </div>
      </section>

      <section id="entregas" className="mt-10 scroll-mt-32">
        <div className="mb-4">
          <SectionHeading count={deliveryItems.length}>Entregas do editor</SectionHeading>
        </div>
        <FileList
          files={deliveryItems}
          emptyText="Nenhuma entrega ainda. Assim que o editor enviar um vídeo final, ele aparece aqui."
        />
      </section>
    </div>
  );
}
