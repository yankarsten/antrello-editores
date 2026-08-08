"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NAME_MAX_LENGTH } from "@/lib/users";
import CopyLinkField from "./CopyLinkField";

// Name-only form: the admin never sets, sees or resets a password — the invitee
// chooses one when they open the link.
export default function InviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; url: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setSubmitting(true);

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));

    if (!res || !res.ok) {
      setError(data?.error ?? "Não foi possível criar o link de acesso.");
      setSubmitting(false);
      return;
    }

    setCreated({ name: data.name, url: data.url });
    setName("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-medium">Criar link de acesso</h2>
      <p className="mt-1 text-sm text-ink/60">
        Informe apenas o nome. A pessoa abre o link e define a própria senha — não existe cadastro
        fora daqui.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="invite-name" className="label">Nome do editor(a)</label>
          <input
            id="invite-name"
            type="text"
            required
            maxLength={NAME_MAX_LENGTH}
            className="input"
            placeholder="Ex.: Marina Duarte"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary shrink-0">
          {submitting ? "Gerando…" : "Gerar link"}
        </button>
      </form>

      {error && <p className="alert-error mt-4">{error}</p>}

      {created && (
        <div className="mt-5 rounded-card border border-ink bg-mist p-4">
          <p className="text-sm font-medium text-ink">
            Link de acesso para {created.name} — copie agora
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Guardamos apenas um resumo criptográfico do link, então ele não pode ser exibido de novo.
            Se perder, gere um novo na lista abaixo.
          </p>
          <CopyLinkField url={created.url} className="mt-3" />
        </div>
      )}
    </div>
  );
}
