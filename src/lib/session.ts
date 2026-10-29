import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "unggas_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isBanned: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Buat sesi baru dan pasang cookie httpOnly. Token mentah HANYA di cookie. */
export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + THIRTY_DAYS) },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(COOKIE);
}

/** User dari cookie sesi, atau null. Sesi kadaluarsa dihapus. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    isAdmin: session.user.isAdmin,
    isBanned: session.user.isBanned,
  };
}
