import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Removes an editor account. Projects assigned to them are unassigned and their
// delivery videos are kept (both relations fall back to null in the schema), so
// nothing the admin needs is lost together with the account.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Editor não encontrado." }, { status: 404 });
  if (user.role !== "editor") {
    return NextResponse.json({ error: "Só é possível excluir contas de editor." }, { status: 400 });
  }

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
