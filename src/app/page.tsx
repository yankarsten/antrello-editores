import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Middleware normally redirects "/" before this renders; kept as a fallback.
export default async function Home() {
  const session = await getSession();
  redirect(session ? (session.role === "admin" ? "/admin" : "/editor") : "/login");
}
