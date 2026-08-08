import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createInviteToken, hashInviteToken, inviteExpiry, inviteUrl } from "@/lib/invites";

// Issues a fresh token for a pending invite, which is how an admin recovers a
// link that was lost (the stored hash cannot be turned back into a URL) and how
// an expired invite is revived. The previous link stops working immediately.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const invite = await db.invite.findUnique({ where: { id } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Esse convite já foi usado." }, { status: 400 });
  }

  const token = createInviteToken();
  await db.invite.update({
    where: { id },
    data: { tokenHash: hashInviteToken(token), expiresAt: inviteExpiry() },
  });

  return NextResponse.json({ id, name: invite.name, url: inviteUrl(token, request.url) });
}

// Revokes a pending invite. Accepted invites are kept as the record of how an
// account came to exist; delete the editor instead.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const invite = await db.invite.findUnique({ where: { id } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: "Esse convite já virou uma conta. Exclua o editor para removê-lo." },
      { status: 400 }
    );
  }

  await db.invite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
