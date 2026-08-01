// Session token helpers kept free of Node-only imports so the Edge middleware
// can use them too.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "antrello_session";
export const SESSION_DAYS = 7;

export type Role = "admin" | "editor";

export interface Session {
  userId: string;
  role: Role;
  name: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "editor") return null;
    return {
      userId: payload.userId,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
