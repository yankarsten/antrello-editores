"use client";

import { useState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/users";

export default function SetPasswordForm({ token, name }: { token: string; name: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o acesso. Tente novamente.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.role === "admin" ? "/admin" : "/editor";
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">Nome</label>
        {/* Fixed by the invite — shown so the browser can save it alongside the
            password, and so it is obvious what to type on the login page. */}
        <input id="name" type="text" readOnly autoComplete="username" className="input bg-mist" value={name} />
      </div>
      <div>
        <label htmlFor="password" className="label">Senha</label>
        <input
          id="password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          className="input"
          placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="confirmation" className="label">Confirmar senha</label>
        <input
          id="confirmation"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          className="input"
          placeholder="Repita a senha"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
        {submitting ? "Criando acesso…" : "Criar acesso e entrar"}
      </button>
    </form>
  );
}
