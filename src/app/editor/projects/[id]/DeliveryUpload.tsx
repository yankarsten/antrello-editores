"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone, { type UploadDropzoneHandle } from "@/components/UploadDropzone";
import { deliveryStem } from "@/lib/delivery";

export default function DeliveryUpload({
  projectId,
  projectTitle,
  nextRevision,
}: {
  projectId: string;
  projectTitle: string;
  /** Revision number the next delivery will get — r1, r2, r3… */
  nextRevision: number;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const dropzoneRef = useRef<UploadDropzoneHandle>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!dropzoneRef.current?.hasFiles()) {
      setError("Selecione o arquivo de vídeo da entrega.");
      return;
    }
    setUploading(true);
    const ok = await dropzoneRef.current.upload(`/api/projects/${projectId}/delivery-videos`);
    setUploading(false);
    if (!ok) {
      setError("Falha no envio da entrega. Tente novamente.");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  // Only the extension is missing here: it comes from the file the editor picks.
  const namePreview = deliveryStem(projectTitle, nextRevision);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="rounded-control border border-ink bg-mist px-4 py-3 text-sm text-ink/80">
        O arquivo é renomeado automaticamente para{" "}
        <span className="font-medium text-ink">{namePreview}</span>
        <span className="text-ink/60">.{"{formato}"}</span> — não precisa se preocupar com o nome do
        seu export.
      </p>

      <UploadDropzone ref={dropzoneRef} multiple={false} />

      {error && <p className="alert-error">{error}</p>}
      {success && <p className="alert-success">Entrega enviada! O vídeo entrou em revisão.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={uploading} className="btn-primary">
          {uploading ? "Enviando…" : "Enviar entrega"}
        </button>
      </div>
    </form>
  );
}
