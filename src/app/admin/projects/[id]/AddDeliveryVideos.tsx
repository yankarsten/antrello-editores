"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";
import { deliveryStem } from "@/lib/delivery";

/**
 * Lets the admin add a final video to any project — a cut done in-house, a
 * version the editor sent outside the app, or a fix made after the delivery.
 * The files join the same numbered sequence as the editor's own uploads.
 */
export default function AddDeliveryVideos({
  projectId,
  projectTitle,
  nextRevision,
}: {
  projectId: string;
  projectTitle: string;
  /** Revision number the next upload will get — r1, r2, r3… */
  nextRevision: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-accent !px-4 !py-2 text-sm">
        + Adicionar vídeo final
      </button>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-ink">Adicionar vídeo final</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/60 transition hover:text-ink">
          Fechar
        </button>
      </div>
      <p className="mb-4 text-xs text-ink/60">
        Os arquivos são renomeados automaticamente a partir de{" "}
        <span className="font-medium text-ink">{deliveryStem(projectTitle, nextRevision)}</span>, seguindo
        a numeração das entregas deste vídeo.
      </p>
      <UploadDropzone
        multiple
        prompt="Arraste os vídeos finais aqui ou clique para selecionar"
        endpoint={`/api/projects/${projectId}/delivery-videos`}
        onAllDone={() => router.refresh()}
      />
    </div>
  );
}
