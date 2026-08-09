"use client";

import type { EditorOption } from "@/lib/editors";

/** "Marina Duarte — livre" / "Marina Duarte — 2 vídeos em andamento". A native
 * <option> takes text only, so the workload has to ride along in the label. */
export function editorOptionLabel(editor: EditorOption): string {
  if (editor.activeProjects === 0) return `${editor.name} — livre`;
  const plural = editor.activeProjects === 1 ? "vídeo" : "vídeos";
  return `${editor.name} — ${editor.activeProjects} ${plural} em andamento`;
}

/**
 * Picks the editor responsible for a video. Every option spells out how many
 * videos that editor already has open, so the admin can see at a glance who is
 * loaded and who is free before handing out one more.
 */
export default function EditorSelect({
  id,
  value,
  editors,
  disabled = false,
  unassignedLabel,
  onChange,
}: {
  id: string;
  value: string;
  editors: EditorOption[];
  disabled?: boolean;
  /** Text of the "no editor" option — its wording differs per screen. */
  unassignedLabel: string;
  onChange: (editorId: string) => void;
}) {
  const busy = editors.filter((e) => e.activeProjects > 0).length;
  const free = editors.length - busy;

  return (
    <div>
      <label htmlFor={id} className="label">Editor responsável</label>
      <select
        id={id}
        className="input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{unassignedLabel}</option>
        {editors.map((editor) => (
          <option key={editor.id} value={editor.id}>
            {editorOptionLabel(editor)}
          </option>
        ))}
      </select>
      {editors.length > 0 && (
        <p className="mt-2 text-xs text-ink/60">
          {free === 0
            ? "Todos os editores já têm vídeos em andamento."
            : `${free} de ${editors.length} ${editors.length === 1 ? "editor está livre" : "editores estão livres"}.`}
        </p>
      )}
    </div>
  );
}
