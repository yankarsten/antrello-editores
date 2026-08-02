"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectNotes({
  projectId,
  initialNotes,
}: {
  projectId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dirty = notes !== saved;

  async function handleSave() {
    setBusy(true);
    setError(null);
    setDone(false);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível salvar as observações.");
      setBusy(false);
      return;
    }
    setSaved(notes);
    setBusy(false);
    setDone(true);
    router.refresh();
  }

  return (
    <div className="card mt-6 p-6">
      <label htmlFor="notes" className="label">Observações</label>
      <textarea
        id="notes"
        rows={3}
        className="input resize-y"
        placeholder="Anotações internas, ajustes pedidos pelo cliente, pontos de atenção…"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setDone(false);
        }}
        disabled={busy}
      />
      {error && <p className="alert-error mt-4">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-3">
        {done && !dirty && <span className="chip bg-accent text-ink">Observações salvas</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !dirty}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {busy ? "Salvando…" : "Salvar observações"}
        </button>
      </div>
    </div>
  );
}
