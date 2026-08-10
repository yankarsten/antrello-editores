"use client";

import type { EditorOption } from "@/lib/editors";

/** Green means the editor can take the video, red means they are already
 * carrying one. The only two hues in an otherwise monochrome palette, so they
 * have to read as a traffic light and nothing else. */
const FREE_COLOR = "text-green-700";
const BUSY_COLOR = "text-red-600";

function editorColor(editor: EditorOption): string {
  return editor.activeProjects === 0 ? FREE_COLOR : BUSY_COLOR;
}

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
  const selected = editors.find((e) => e.id === value);

  return (
    <div>
      <label htmlFor={id} className="label">Editor responsável</label>
      {/* The colour is set on the <select> as well as on each <option>: while
          the list is open the options carry their own hue, but the closed
          control paints the chosen row in the select's colour. */}
      <select
        id={id}
        className={`input ${selected ? editorColor(selected) : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" className="text-ink">{unassignedLabel}</option>
        {editors.map((editor) => (
          <option key={editor.id} value={editor.id} className={editorColor(editor)}>
            {editorOptionLabel(editor)}
          </option>
        ))}
      </select>
      {editors.length > 0 && (
        <p className="mt-2 text-xs text-ink/60">
          {free === 0 ? (
            <>
              Todos os editores já têm{" "}
              <span className={`font-medium ${BUSY_COLOR}`}>vídeos em andamento</span>.
            </>
          ) : (
            <>
              <span className={`font-medium ${FREE_COLOR}`}>
                {free} de {editors.length} {editors.length === 1 ? "editor está livre" : "editores estão livres"}
              </span>
              {busy > 0 && (
                <>
                  {" · "}
                  <span className={`font-medium ${BUSY_COLOR}`}>
                    {busy} com {busy === 1 ? "vídeo" : "vídeos"} em andamento
                  </span>
                </>
              )}
              .
            </>
          )}
        </p>
      )}
    </div>
  );
}
