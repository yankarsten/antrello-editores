"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button onClick={handleLogout} className="btn-secondary !px-4 !py-1.5 text-sm">
      Sair
    </button>
  );
}
