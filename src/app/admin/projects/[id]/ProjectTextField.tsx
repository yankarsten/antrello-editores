"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One editable long-text field of a video (descrição, observações). Saving is
 * explicit rather than on blur: these are paragraphs the admin edits in place,
 * and an accidental keystroke should not rewrite what the editor is reading.
 */
export default function ProjectTextField({
  projectId,
  field,
  label,
  placeholder,
  initialValue,
  saveLabel,
  savedLabel,
  rows = 3,
}: {
  projectId: string;
  /** Key sent to PATCH /api/projects/[id]. */
  field: "description" | "notes";
  label: string;
  placeholder: string;
  initialValue: string;
  /** "Salvar descrição" — the button at rest. */
  saveLabel: string;
  /** "Descrição salva" — the confirmation chip. */
  savedLabel: string;
  rows?: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dirty = value !== saved;

  async function handleSave() {
    setBusy(true);
    setError(null);
    setDone(false);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível salvar a alteração.");
      setBusy(false);
      return;
    }
    setSaved(value);
    setBusy(false);
    setDone(true);
    router.refresh();
  }

  return (
    <div className="card mt-6 p-6">
      <label htmlFor={field} className="label">{label}</label>
      <textarea
        id={field}
        rows={rows}
        className="input resize-y"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDone(false);
        }}
        disabled={busy}
      />
      {error && <p className="alert-error mt-4">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-3">
        {done && !dirty && <span className="chip bg-accent text-ink">{savedLabel}</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !dirty}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {busy ? "Salvando…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
