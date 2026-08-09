import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { MediaKind } from "@/lib/media";
import DeadlineBadge from "@/components/DeadlineBadge";
import StatusBadge from "@/components/StatusBadge";
import FileList, { type FileItem } from "@/components/FileList";
import SectionNav from "@/components/SectionNav";
import { SectionHeading } from "@/components/PageHeader";
import DeliveryUpload from "./DeliveryUpload";

export const dynamic = "force-dynamic";

/** Rows shown before a long list collapses behind "Mostrar todos". */
const PREVIEW_ROWS = 4;

export default async function EditorProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      sourceVideos: { orderBy: { uploadedAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "asc" } },
      deliveryVideos: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
    },
  });
  // Editors only ever see their own projects — anything else 404s.
  if (!project || project.assignedEditorId !== session.userId) notFound();

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

  const suggestedLabel =
    deliveryItems.length === 0 ? "Vídeo Final" : `Vídeo Final R${deliveryItems.length + 1}`;

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
          { id: "enviar", label: "Enviar entrega" },
          { id: "entregas", label: "Minhas entregas", count: deliveryItems.length },
        ]}
      />

      {project.description && (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{project.description}</p>
      )}

      {project.notes && (
        <div className="card-mist mt-6 p-6">
          <SectionHeading>Observações</SectionHeading>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{project.notes}</p>
        </div>
      )}

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
          emptyText="A administração ainda não enviou nenhum vídeo bruto aqui."
        />
      </section>

      <section id="anexos" className="mt-10 scroll-mt-32">
        <div className="mb-4">
          <SectionHeading count={attachmentItems.length}>Anexos</SectionHeading>
          <p className="mt-1 text-sm text-ink/60">
            Material de apoio enviado pela administração — referências, thumbnails, logos, prints.
          </p>
        </div>
        <FileList
          files={attachmentItems}
          maxVisible={PREVIEW_ROWS}
          emptyText="Nenhum anexo para este vídeo."
        />
      </section>

      <section id="enviar" className="mt-10 scroll-mt-32">
        <div className="mb-4">
          <SectionHeading>Enviar entrega</SectionHeading>
        </div>
        <div className="rounded-card border border-ink bg-white p-8 shadow-hard">
          <DeliveryUpload projectId={project.id} suggestedLabel={suggestedLabel} />
        </div>
      </section>

      <section id="entregas" className="mt-10 scroll-mt-32">
        <div className="mb-4">
          <SectionHeading count={deliveryItems.length}>Minhas entregas</SectionHeading>
        </div>
        <FileList
          files={deliveryItems}
          emptyText="Você ainda não enviou nenhuma entrega para este vídeo."
        />
      </section>
    </div>
  );
}
