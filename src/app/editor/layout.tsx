import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSession } from "@/lib/auth";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "editor") redirect("/login");
  return <AppShell session={session}>{children}</AppShell>;
}
