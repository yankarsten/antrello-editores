"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white"
    >
      Sair
    </button>
  );
}
