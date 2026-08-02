"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";

interface EditorOption {
  id: string;
  name: string;
}

export default function ProjectControls({
  projectId,
  currentStatus,
  currentEditorId,
  editors,
}: {
  projectId: string;
  currentStatus: string;
  currentEditorId: string;
  editors: EditorOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível salvar a alteração.");
    }
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este projeto? Os vídeos enviados também serão removidos. Essa ação não pode ser desfeita.")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      setError("Não foi possível excluir o projeto.");
      setBusy(false);
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="assigned-editor" className="label">Editor responsável</label>
          <select
            id="assigned-editor"
            className="input"
            defaultValue={currentEditorId}
            disabled={busy}
            onChange={(e) => patch({ assignedEditorId: e.target.value || null })}
          >
            <option value="">Sem editor atribuído</option>
            {editors.map((editor) => (
              <option key={editor.id} value={editor.id}>
                {editor.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select
            id="status"
            className="input"
            defaultValue={currentStatus}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="alert-error mt-4">{error}</p>}
      <div className="mt-5 border-t border-ink/15 pt-5">
        <button type="button" onClick={handleDelete} disabled={busy} className="btn-danger !px-3 !py-1.5 text-xs">
          Excluir projeto
        </button>
      </div>
    </div>
  );
}
