"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";

export default function AddSourceVideos({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary !px-3 !py-1.5 text-xs">
        + Adicionar vídeos brutos
      </button>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">Adicionar vídeos brutos</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
          Fechar
        </button>
      </div>
      <UploadDropzone
        multiple
        endpoint={`/api/projects/${projectId}/source-videos`}
        onAllDone={() => router.refresh()}
      />
    </div>
  );
}
