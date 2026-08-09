"use client";

import { useRef, useState } from "react";
import UploadDropzone, { type UploadDropzoneHandle } from "@/components/UploadDropzone";
import EditorSelect from "@/components/EditorSelect";
import type { ProjectStatus } from "@/lib/constants";
import type { EditorOption } from "@/lib/editors";

export default function NewProjectForm({
  editors,
  status,
  defaultDeadline = "",
  onCreated,
  onCancel,
}: {
  editors: EditorOption[];
  /** Column the project is created in; the server falls back to the default. */
  status?: ProjectStatus;
  /** "YYYY-MM-DD" prefilled when creating from a calendar day. */
  defaultDeadline?: string;
  onCreated: (projectId: string) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [assignedEditorId, setAssignedEditorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "creating" | "uploading">("idle");
  const dropzoneRef = useRef<UploadDropzoneHandle>(null);
  // Remembers the project created on a previous attempt so a failed upload can
  // be retried without duplicating the project.
  const createdIdRef = useRef<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let projectId = createdIdRef.current;
    if (!projectId) {
      setPhase("creating");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          notes,
          deadline,
          status,
          assignedEditorId: assignedEditorId || null,
        }),
      }).catch(() => null);
      const data = await res?.json().catch(() => ({}));
      if (!res || !res.ok) {
        setError(data?.error ?? "Não foi possível criar o vídeo.");
        setPhase("idle");
        return;
      }
      projectId = data.id as string;
      createdIdRef.current = projectId;
    }

    if (dropzoneRef.current?.hasFiles()) {
      setPhase("uploading");
      const ok = await dropzoneRef.current.upload(`/api/projects/${projectId}/source-videos`);
      if (!ok) {
        setError("O vídeo foi criado, mas o envio de alguns arquivos falhou. Clique novamente para reenviar os pendentes.");
        setPhase("idle");
        return;
      }
    }

    onCreated(projectId);
  }

  const busy = phase !== "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="label">Título *</label>
        <input
          id="title"
          type="text"
          required
          autoFocus
          className="input"
          placeholder="Ex.: Institucional Café Bravo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />
      </div>

      <div>
        <label htmlFor="description" className="label">Descrição</label>
        <textarea
          id="description"
          rows={3}
          className="input resize-y"
          placeholder="Briefing, referências, duração esperada…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
        />
      </div>

      <div>
        <label htmlFor="notes" className="label">Observações</label>
        <textarea
          id="notes"
          rows={3}
          className="input resize-y"
          placeholder="Anotações internas, ajustes pedidos pelo cliente, pontos de atenção…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="deadline" className="label">Prazo de entrega *</label>
          <input
            id="deadline"
            type="date"
            required
            className="input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={busy}
          />
        </div>
        <EditorSelect
          id="editor"
          value={assignedEditorId}
          editors={editors}
          disabled={busy}
          unassignedLabel="Atribuir depois"
          onChange={setAssignedEditorId}
        />
      </div>

      <div>
        <span className="label">Vídeos brutos</span>
        <UploadDropzone ref={dropzoneRef} multiple />
        <p className="mt-2 text-xs text-ink/60">
          Os arquivos são enviados quando você salva o vídeo, com progresso individual por arquivo.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-ink/15 pt-5">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {phase === "creating" && "Criando vídeo…"}
          {phase === "uploading" && "Enviando vídeos…"}
          {phase === "idle" && "Criar vídeo"}
        </button>
      </div>
    </form>
  );
}
