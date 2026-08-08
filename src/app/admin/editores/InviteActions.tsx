"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CopyLinkField from "./CopyLinkField";

export default function InviteActions({
  inviteId,
  inviteName,
  expired,
}: {
  inviteId: string;
  inviteName: string;
  expired: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"regenerate" | "revoke" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  async function regenerate() {
    setBusy("regenerate");
    setError(null);
    const res = await fetch(`/api/invites/${inviteId}`, { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "Não foi possível gerar um novo link.");
      setBusy(null);
      return;
    }
    setUrl(data.url);
    setBusy(null);
    router.refresh();
  }

  async function revoke() {
    if (!window.confirm(`Revogar o convite de ${inviteName}? O link para de funcionar na hora.`)) return;
    setBusy("revoke");
    setError(null);
    const res = await fetch(`/api/invites/${inviteId}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error ?? "Não foi possível revogar o convite.");
      setBusy(null);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={regenerate}
          disabled={busy !== null}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {busy === "regenerate" ? "Gerando…" : expired ? "Renovar link" : "Novo link"}
        </button>
        <button
          type="button"
          onClick={revoke}
          disabled={busy !== null}
          className="btn-danger !px-3 !py-1.5 text-xs"
        >
          {busy === "revoke" ? "Revogando…" : "Revogar"}
        </button>
      </div>
      {url && <CopyLinkField url={url} className="w-full min-w-[18rem]" />}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
