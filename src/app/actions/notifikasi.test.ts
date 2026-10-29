import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { randomBytes } from "crypto";

vi.mock("@/lib/session", () => {
  let current: { id: number; username: string; email: string; isAdmin: boolean; isBanned: boolean } | null = null;
  return {
    getSessionUser: async () => current,
    createSession: async () => {},
    destroySession: async () => {},
    setCurrentUser: (u: typeof current) => { current = u; },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("NEXT_REDIRECT " + path); } }));

import { _resetBuckets } from "@/lib/ratelimit";

import { balas } from "./forum";
import { setCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

let penulisDiskusi = 0;
let diskusiId = 0;
let pemablasId = 0;
const tag = randomBytes(3).toString("hex");

async function buatUser(username: string, banned = false) {
  return prisma.user.create({
    data: {
      username,
      email: `${username}@example.com`, // taste-skill-ignore placeholder-data
      passwordHash: await hashPassword("T3sP3t3rnak!2026"),
      emailVerifiedAt: new Date(),
      isBanned: banned,
    },
  });
}

beforeAll(async () => {
  const a = await buatUser("pnls" + tag);
  penulisDiskusi = a.id;
  const b = await buatUser("pbla" + tag);
  pemablasId = b.id;
  const d = await prisma.discussion.create({
    data: {
      userId: penulisDiskusi,
      title: "Diskusi in-app " + tag,
      posts: { create: { userId: penulisDiskusi, number: 1, content: "Isi awal." } },
    },
  });
  diskusiId = d.id;
});

beforeEach(() => {
  setCurrentUser(null);
  _resetBuckets();
});

describe("notifikasi in-app saat diskusi dibalas", () => {
  it("membuat notifikasi untuk penulis diskusi saat dibalas orang lain", async () => {
    setCurrentUser({ id: pemablasId, username: "pemablas", email: "", isAdmin: false, isBanned: false });
    const r = await balas(null, fd({ discussionId: String(diskusiId), content: "Balasan pemicu notifikasi." }));
    expect(r).toEqual({ ok: true });
    const n = await prisma.notification.findFirst({
      where: { userId: penulisDiskusi, discussionId: diskusiId, actorId: pemablasId },
    });
    expect(n).not.toBeNull();
    expect(n!.readAt).toBeNull();
  });

  it("tidak membuat notifikasi saat penulis membalas diskusinya sendiri", async () => {
    setCurrentUser({ id: penulisDiskusi, username: "penulis", email: "", isAdmin: false, isBanned: false });
    const sebelum = await prisma.notification.count({ where: { userId: penulisDiskusi } });
    await balas(null, fd({ discussionId: String(diskusiId), content: "Self reply." }));
    const sesudah = await prisma.notification.count({ where: { userId: penulisDiskusi } });
    expect(sesudah).toBe(sebelum);
  });

  it("tidak membuat notifikasi ke penulis yang dibanned", async () => {
    await prisma.user.update({ where: { id: penulisDiskusi }, data: { isBanned: true } });
    setCurrentUser({ id: pemablasId, username: "pemablas", email: "", isAdmin: false, isBanned: false });
    const sebelum = await prisma.notification.count({ where: { userId: penulisDiskusi } });
    await balas(null, fd({ discussionId: String(diskusiId), content: "Balasan saat penulis banned." }));
    const sesudah = await prisma.notification.count({ where: { userId: penulisDiskusi } });
    expect(sesudah).toBe(sebelum);
    await prisma.user.update({ where: { id: penulisDiskusi }, data: { isBanned: false } });
  });
});
