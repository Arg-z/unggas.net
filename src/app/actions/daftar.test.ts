import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomBytes } from "crypto";

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

const sesiDibuat: number[] = [];

vi.mock("@/lib/session", () => ({
  getSessionUser: async () => null,
  createSession: async (id: number) => {
    sesiDibuat.push(id);
  },
  destroySession: async () => {},
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("NEXT_REDIRECT " + path);
  },
}));

import { daftar } from "./auth";
import { prisma } from "@/lib/db";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

const suffix = randomBytes(4).toString("hex");
const uname = `baru${suffix}`;

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { username: uname }, select: { id: true } })).map((u) => u.id);
  if (ids.length === 0) return;
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe("daftar saat email dimatikan", () => {
  beforeAll(() => {
    delete process.env.EMAIL_AKTIF;
  });

  it("membuat akun aktif tanpa email lalu langsung memberi sesi", async () => {
    await expect(
      daftar(null, fd({ username: uname, password: "T3sP3t3rnak!2026", website: "" })),
    ).rejects.toThrow("NEXT_REDIRECT /");

    const user = await prisma.user.findUnique({ where: { username: uname } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(`${uname}@unggas.local`);
    expect(user?.emailVerifiedAt).not.toBeNull();
    expect(sesiDibuat).toContain(user?.id);
  });

  it("menolak username yang sudah dipakai", async () => {
    const r = await daftar(null, fd({ username: uname, password: "T3sP3t3rnak!2026", website: "" }));
    expect(r).toEqual({ ok: false, alasan: "Username sudah dipakai" });
  });
});
