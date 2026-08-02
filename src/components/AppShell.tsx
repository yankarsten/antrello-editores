import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { Session } from "@/lib/auth";

const NAV_LINKS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Quadro" },
    { href: "/admin/calendario", label: "Calendário" },
    { href: "/admin/projects/new", label: "Novo projeto" },
    { href: "/admin/editores", label: "Editores" },
    { href: "/admin/historico", label: "Histórico" },
  ],
  editor: [{ href: "/editor", label: "Meus projetos" }],
};

export default function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const links = NAV_LINKS[session.role] ?? [];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-zinc-900 text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href={session.role === "admin" ? "/admin" : "/editor"} className="shrink-0 text-base font-bold tracking-tight">
            Antrello <span className="text-indigo-400">Editores</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-zinc-400 sm:inline" title={session.name}>
              {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
