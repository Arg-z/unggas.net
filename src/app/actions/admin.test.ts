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

import { revalidatePath } from "next/cache";

import { sembunyikanPost, tampilkanPost, sembunyikanDiskusi, tampilkanDiskusi, setSematkan, setBan } from "./admin";
import { setCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { listDiscussions, getThread } from "@/lib/forum";

const suffix = randomBytes(4).toString("hex");
const adminUname = `tesadm${suffix}`;
const userUname = `tesusr${suffix}`;

let adminId = 0;
let userId = 0;
let diskusiId = 0;
let postId1 = 0;
let postId2 = 0;

function sesi(id: number, username: string, isAdmin: boolean) {
  return { id, username, email: "", isAdmin, isBanned: false };
}

beforeAll(async () => {
  const passwordHash = await hashPassword("T3sP3t3rnak!2026");
  const admin = await prisma.user.create({
    data: { username: adminUname, email: `${adminUname}@example.com`, passwordHash, isAdmin: true }, // taste-skill-ignore placeholder-data
  });
  const user = await prisma.user.create({
    data: { username: userUname, email: `${userUname}@example.com`, passwordHash }, // taste-skill-ignore placeholder-data
  });
  adminId = admin.id;
  userId = user.id;

  const d = await prisma.discussion.create({
    data: {
      userId,
      title: `Tes moderasi ${suffix}`,
      posts: {
        create: [
          { userId, number: 1, content: "Post pertama untuk latihan moderasi." },
          { userId, number: 2, content: "Post kedua untuk latihan moderasi." },
        ],
      },
    },
    include: { posts: true },
  });
  diskusiId = d.id;
  postId1 = d.posts.find((p) => p.number === 1)!.id;
  postId2 = d.posts.find((p) => p.number === 2)!.id;
});

beforeEach(() => {
  setCurrentUser(null);
  vi.mocked(revalidatePath).mockClear();
});

describe("guard admin", () => {
  it("menolak tanpa login", async () => {
    const hasil = await Promise.all([
      sembunyikanPost(postId1),
      tampilkanPost(postId2),
      sembunyikanDiskusi(diskusiId),
      tampilkanDiskusi(diskusiId),
      setSematkan(diskusiId, true),
      setBan(userId, true),
    ]);
    for (const r of hasil) expect(r).toEqual({ ok: false, alasan: "Khusus admin" });
  });

  it("menolak user biasa dan tidak mengubah data", async () => {
    setCurrentUser(sesi(userId, userUname, false));
    const hasil = await Promise.all([
      sembunyikanPost(postId1),
      tampilkanPost(postId2),
      sembunyikanDiskusi(diskusiId),
      tampilkanDiskusi(diskusiId),
      setSematkan(diskusiId, true),
      setBan(adminId, true),
    ]);
    for (const r of hasil) expect(r).toEqual({ ok: false, alasan: "Khusus admin" });

    const [post, diskusi, admin] = await Promise.all([
      prisma.post.findUniqueOrThrow({ where: { id: postId1 } }),
      prisma.discussion.findUniqueOrThrow({ where: { id: diskusiId } }),
      prisma.user.findUniqueOrThrow({ where: { id: adminId } }),
    ]);
    expect(post.isHidden).toBe(false);
    expect(diskusi.isHidden).toBe(false);
    expect(diskusi.isPinned).toBe(false);
    expect(admin.isBanned).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("sebagai admin", () => {
  beforeEach(() => {
    setCurrentUser(sesi(adminId, adminUname, true));
  });

  it("sembunyikanPost lalu tampilkanPost mengubah isHidden di DB", async () => {
    await expect(sembunyikanPost(postId1)).resolves.toEqual({ ok: true });
    expect((await prisma.post.findUniqueOrThrow({ where: { id: postId1 } })).isHidden).toBe(true);

    await expect(tampilkanPost(postId1)).resolves.toEqual({ ok: true });
    expect((await prisma.post.findUniqueOrThrow({ where: { id: postId1 } })).isHidden).toBe(false);
  });

  it("revalidatePath dipanggil setelah aksi", async () => {
    await sembunyikanPost(postId1);
    await tampilkanPost(postId1);
    await sembunyikanDiskusi(diskusiId);
    await tampilkanDiskusi(diskusiId);
    expect(revalidatePath).toHaveBeenCalled();
    expect(vi.mocked(revalidatePath).mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("sembunyikanDiskusi lalu tampilkanDiskusi mengubah isHidden di DB", async () => {
    await expect(sembunyikanDiskusi(diskusiId)).resolves.toEqual({ ok: true });
    expect((await prisma.discussion.findUniqueOrThrow({ where: { id: diskusiId } })).isHidden).toBe(true);

    await expect(tampilkanDiskusi(diskusiId)).resolves.toEqual({ ok: true });
    expect((await prisma.discussion.findUniqueOrThrow({ where: { id: diskusiId } })).isHidden).toBe(false);
  });

  it("setSematkan true lalu false mengubah isPinned di DB", async () => {
    await expect(setSematkan(diskusiId, true)).resolves.toEqual({ ok: true });
    expect((await prisma.discussion.findUniqueOrThrow({ where: { id: diskusiId } })).isPinned).toBe(true);

    await expect(setSematkan(diskusiId, false)).resolves.toEqual({ ok: true });
    expect((await prisma.discussion.findUniqueOrThrow({ where: { id: diskusiId } })).isPinned).toBe(false);
  });

  it("setBan true lalu false mengubah isBanned di DB", async () => {
    await expect(setBan(userId, true)).resolves.toEqual({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).isBanned).toBe(true);

    await expect(setBan(userId, false)).resolves.toEqual({ ok: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).isBanned).toBe(false);
  });
});

describe("konten tersembunyi tidak tampil di daftar/thread", () => {
  it("diskusi tersembunyi hilang dari listDiscussions dan getThread null", async () => {
    const d = await prisma.discussion.create({
      data: {
        userId,
        title: `Tes sembunyi daftar ${suffix}`,
        posts: { create: { userId, number: 1, content: "Konten awal diskusi yang akan disembunyikan." } },
      },
    });
    setCurrentUser(sesi(adminId, adminUname, true));

    const sebelum = await listDiscussions({ user: null });
    expect(sebelum.rows.some((r) => r.id === d.id)).toBe(true);

    await sembunyikanDiskusi(d.id);

    const sesudah = await listDiscussions({ user: null });
    expect(sesudah.rows.some((r) => r.id === d.id)).toBe(false);
    expect(await getThread(d.id, null)).toBeNull();
    // Admin masih bisa membuka thread tersembunyi.
    const sebagaiAdmin = await getThread(d.id, sesi(adminId, adminUname, true));
    expect(sebagaiAdmin?.isHidden).toBe(true);

    await tampilkanDiskusi(d.id);
    const pulih = await listDiscussions({ user: null });
    expect(pulih.rows.some((r) => r.id === d.id)).toBe(true);
  });

  it("post tersembunyi tidak muncul di getThread", async () => {
    const d = await prisma.discussion.create({
      data: {
        userId,
        title: `Tes sembunyi post ${suffix}`,
        posts: {
          create: [
            { userId, number: 1, content: "Post ini tetap tampil." },
            { userId, number: 2, content: "Post ini akan disembunyikan admin." },
          ],
        },
      },
    });
    const posts = await prisma.post.findMany({ where: { discussionId: d.id } });
    const target = posts.find((p) => p.number === 2)!;

    setCurrentUser(sesi(adminId, adminUname, true));
    await sembunyikanPost(target.id);

    const thread = await getThread(d.id, null);
    expect(thread).not.toBeNull();
    expect(thread!.posts).toHaveLength(1);
    expect(thread!.posts.some((p) => p.id === target.id)).toBe(false);
  });
});
