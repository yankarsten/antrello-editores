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
  currentDeadline,
  editors,
}: {
  projectId: string;
  currentStatus: string;
  currentEditorId: string;
  /** "YYYY-MM-DD" in the app's timezone. */
  currentDeadline: string;
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
    if (!window.confirm("Excluir este vídeo? Os arquivos enviados também serão removidos. Essa ação não pode ser desfeita.")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      setError("Não foi possível excluir o vídeo.");
      setBusy(false);
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <div>
          <label htmlFor="deadline" className="label">Prazo de entrega</label>
          <input
            id="deadline"
            type="date"
            className="input"
            defaultValue={currentDeadline}
            disabled={busy}
            // An empty value means the date is still half-typed — only a
            // complete date is worth persisting.
            onChange={(e) => e.target.value && patch({ deadline: e.target.value })}
          />
        </div>
      </div>
      {error && <p className="alert-error mt-4">{error}</p>}
      <div className="mt-5 border-t border-ink/15 pt-5">
        <button type="button" onClick={handleDelete} disabled={busy} className="btn-danger !px-3 !py-1.5 text-xs">
          Excluir vídeo
        </button>
      </div>
    </div>
  );
}
