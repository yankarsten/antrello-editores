"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteEditorButton({
  editorId,
  editorName,
  activeProjects,
  deliveries,
}: {
  editorId: string;
  editorName: string;
  activeProjects: number;
  deliveries: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const consequences = [
      activeProjects > 0 &&
        `${activeProjects} projeto${activeProjects > 1 ? "s" : ""} em andamento ficará${
          activeProjects > 1 ? "o" : ""
        } sem editor responsável.`,
      deliveries > 0 &&
        `As ${deliveries} entrega${deliveries > 1 ? "s" : ""} já enviada${
          deliveries > 1 ? "s" : ""
        } continuam disponíveis nos projetos.`,
    ].filter(Boolean);

    const message = [
      `Excluir a conta de ${editorName}?`,
      ...consequences,
      "Essa ação não pode ser desfeita.",
    ].join("\n\n");

    if (!window.confirm(message)) return;

    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users/${editorId}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível excluir o editor.");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="btn-danger !px-3 !py-1.5 text-xs"
      >
        {busy ? "Excluindo…" : "Excluir"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
