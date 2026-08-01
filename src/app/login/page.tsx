"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Antrello <span className="text-indigo-600">Editores</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Gestão de projetos de edição de vídeo</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Entrar</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">E-mail</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          É editor(a) e ainda não tem conta?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
