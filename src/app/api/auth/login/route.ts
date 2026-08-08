import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword, type Role } from "@/lib/auth";
import { normalizeName } from "@/lib/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const nameKey = typeof body?.name === "string" ? normalizeName(body.name) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!nameKey || !password) {
    return NextResponse.json({ error: "Informe nome e senha." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { nameKey } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Nome ou senha incorretos." }, { status: 401 });
  }

  await createSession({ userId: user.id, role: user.role as Role, name: user.name });
  return NextResponse.json({ role: user.role });
}
