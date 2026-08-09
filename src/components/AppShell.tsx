import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import type { Session } from "@/lib/auth";

const NAV_LINKS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Quadro" },
    { href: "/admin/calendario", label: "Calendário" },
    { href: "/admin/editores", label: "Editores" },
  ],
  editor: [{ href: "/editor", label: "Meus vídeos" }],
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
      {/* 68px bar and 1240px content width mirror the landing page's nav. */}
      <header className="sticky top-0 z-40 border-b border-ink bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-6 px-4 sm:px-6">
          <Link
            href={session.role === "admin" ? "/admin" : "/editor"}
            className="shrink-0 text-lg font-medium tracking-tight"
          >
            Antrello <span className="pill">Editores</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-control px-3 py-1.5 text-sm transition hover:bg-mist"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-ink/60 sm:inline" title={session.name}>
              {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
