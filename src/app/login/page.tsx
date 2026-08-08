"use client";

import { useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar. Tente novamente.");
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
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-medium tracking-tight">
            Antrello <span className="pill">Editores</span>
          </h1>
          <p className="mt-3 text-base text-ink/70">Gestão de projetos de edição de vídeo</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-card border border-ink bg-white p-8 shadow-hard sm:p-10">
          <h2 className="mb-6 text-2xl font-medium">Entrar</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Nome</label>
              <input
                id="name"
                type="text"
                required
                autoComplete="username"
                className="input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Senha</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="alert-error">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          O acesso é criado pela administração. Peça o seu link de acesso para receber uma conta.
        </p>
      </div>
    </main>
  );
}
