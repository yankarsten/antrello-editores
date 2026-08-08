import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createInviteToken, hashInviteToken, inviteExpiry, inviteUrl } from "@/lib/invites";
import { cleanName, normalizeName } from "@/lib/users";

// Creates an access link for a new editor. The admin supplies nothing but the
// name; the invitee picks their own password when they open the link.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = cleanName(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }
  const nameKey = normalizeName(name);

  if (await db.user.findUnique({ where: { nameKey } })) {
    return NextResponse.json({ error: `Já existe uma conta com o nome "${name}".` }, { status: 409 });
  }
  if (await db.invite.findUnique({ where: { nameKey } })) {
    return NextResponse.json(
      { error: `Já existe um convite para "${name}". Gere um novo link ou revogue o atual.` },
      { status: 409 }
    );
  }

  const token = createInviteToken();
  const invite = await db.invite.create({
    data: {
      name,
      nameKey,
      tokenHash: hashInviteToken(token),
      role: "editor",
      createdById: session.userId,
      expiresAt: inviteExpiry(),
    },
  });

  // The raw token is returned exactly once, here — the database only holds its
  // hash, so this response is the admin's only chance to copy the link before
  // regenerating it.
  return NextResponse.json(
    { id: invite.id, name: invite.name, url: inviteUrl(token, request.url) },
    { status: 201 }
  );
}
