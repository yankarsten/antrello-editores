"use client";

import { useRef, useState } from "react";
import UploadDropzone, { type UploadDropzoneHandle } from "@/components/UploadDropzone";

interface EditorOption {
  id: string;
  name: string;
}

export default function NewProjectForm({ editors }: { editors: EditorOption[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
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
          assignedEditorId: assignedEditorId || null,
        }),
      }).catch(() => null);
      const data = await res?.json().catch(() => ({}));
      if (!res || !res.ok) {
        setError(data?.error ?? "Não foi possível criar o projeto.");
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
        setError("O projeto foi criado, mas alguns vídeos falharam. Clique novamente para reenviar os pendentes.");
        setPhase("idle");
        return;
      }
    }

    window.location.href = `/admin/projects/${projectId}`;
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
        <div>
          <label htmlFor="editor" className="label">Editor responsável</label>
          <select
            id="editor"
            className="input"
            value={assignedEditorId}
            onChange={(e) => setAssignedEditorId(e.target.value)}
            disabled={busy}
          >
            <option value="">Atribuir depois</option>
            {editors.map((editor) => (
              <option key={editor.id} value={editor.id}>
                {editor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="label">Vídeos brutos</span>
        <UploadDropzone ref={dropzoneRef} multiple />
        <p className="mt-1.5 text-xs text-zinc-500">
          Os arquivos são enviados quando você salva o projeto, com progresso individual por arquivo.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
        <button type="submit" disabled={busy} className="btn-primary">
          {phase === "creating" && "Criando projeto…"}
          {phase === "uploading" && "Enviando vídeos…"}
          {phase === "idle" && "Criar projeto"}
        </button>
      </div>
    </form>
  );
}
