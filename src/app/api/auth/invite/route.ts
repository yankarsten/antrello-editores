import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, hashPassword, type Role } from "@/lib/auth";
import { hashInviteToken, isInviteUsable } from "@/lib/invites";
import { PASSWORD_MIN_LENGTH } from "@/lib/users";

// The only way an account is ever created. Consumes an invite token, stores the
// password the invitee chose and signs them in.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Link de acesso inválido." }, { status: 400 });
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const invite = await db.invite.findUnique({ where: { tokenHash: hashInviteToken(token) } });
  if (!invite || !isInviteUsable(invite)) {
    return NextResponse.json(
      { error: "Este link de acesso não é mais válido. Peça um novo para a administração." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const role = invite.role as Role;

  // One transaction so a token can never produce two accounts: the update is
  // scoped to `acceptedAt: null`, and two concurrent requests cannot both match
  // that condition.
  try {
    const user = await db.$transaction(async (tx) => {
      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count === 0) throw new InviteAlreadyUsedError();

      const created = await tx.user.create({
        data: { name: invite.name, nameKey: invite.nameKey, passwordHash, role },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedById: created.id } });
      return created;
    });

    await createSession({ userId: user.id, role, name: user.name });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    if (error instanceof InviteAlreadyUsedError) {
      return NextResponse.json({ error: "Este link de acesso já foi usado." }, { status: 400 });
    }
    // Unique violation on nameKey: someone took the name between the invite and
    // now, so the invite cannot be honoured as-is.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma conta com esse nome. Fale com a administração." },
        { status: 409 }
      );
    }
    throw error;
  }
}

class InviteAlreadyUsedError extends Error {}
