import { createHash, randomBytes } from "node:crypto";

export const INVITE_DAYS = 7;

// 32 random bytes — far beyond guessable, and the link is the only credential
// standing between a stranger and an editor account.
export function createInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + INVITE_DAYS);
  return d;
}

// Base URL for the links handed to invitees. Behind the Cloudflare Tunnel the
// request host is the public one, so deriving it from the incoming request
// keeps the link correct without extra configuration; APP_URL overrides it.
export function inviteUrl(token: string, requestUrl: string): string {
  const base = process.env.APP_URL?.replace(/\/+$/, "") ?? new URL(requestUrl).origin;
  return `${base}/convite/${token}`;
}

export function isInviteUsable(invite: { acceptedAt: Date | null; expiresAt: Date }): boolean {
  return invite.acceptedAt === null && invite.expiresAt.getTime() > Date.now();
}
