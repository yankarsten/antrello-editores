"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone, { type UploadDropzoneHandle } from "@/components/UploadDropzone";

export default function DeliveryUpload({
  projectId,
  suggestedLabel,
}: {
  projectId: string;
  suggestedLabel: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(suggestedLabel);
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
    const ok = await dropzoneRef.current.upload(`/api/projects/${projectId}/delivery-videos`, {
      "x-label": label.trim() || "Vídeo Final",
    });
    setUploading(false);
    if (!ok) {
      setError("Falha no envio da entrega. Tente novamente.");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="delivery-label" className="label">Nome da entrega</label>
        <input
          id="delivery-label"
          type="text"
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={120}
          disabled={uploading}
        />
        <p className="mt-2 text-xs text-ink/60">
          Use nomes como “Vídeo Final”, “Vídeo Final R2”… para identificar cada revisão.
        </p>
      </div>

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
