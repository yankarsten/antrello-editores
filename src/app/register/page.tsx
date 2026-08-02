"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar a conta. Tente novamente.");
        setSubmitting(false);
        return;
      }
      window.location.href = "/editor";
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
          <p className="mt-3 text-base text-ink/70">Crie sua conta de editor(a)</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-card border border-ink bg-white p-8 shadow-hard sm:p-10">
          <h2 className="mb-6 text-2xl font-medium">Cadastro de editor(a)</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Nome</label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                className="input"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                className="input"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="alert-error">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
              {submitting ? "Criando conta…" : "Criar conta"}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
