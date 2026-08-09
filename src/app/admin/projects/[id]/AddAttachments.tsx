"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";
import { ATTACHMENT_EXTENSIONS } from "@/lib/media";

export default function AddAttachments({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-accent !px-4 !py-2 text-sm">
        + Adicionar anexos
      </button>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-ink">Adicionar anexos</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/60 transition hover:text-ink">
          Fechar
        </button>
      </div>
      <UploadDropzone
        multiple
        allowedExtensions={ATTACHMENT_EXTENSIONS}
        prompt="Arraste vídeos ou imagens aqui ou clique para selecionar"
        endpoint={`/api/projects/${projectId}/attachments`}
        onAllDone={() => router.refresh()}
      />
    </div>
  );
}
