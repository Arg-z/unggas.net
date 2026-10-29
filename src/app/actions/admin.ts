"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; alasan: string };

/** Guard server-side: hanya admin aktif yang boleh melakukan aksi moderasi. */
async function guardAdmin() {
  const user = await getSessionUser();
  // Admin yang diblokir diperlakukan bukan admin (konsisten dengan requireUser).
  if (!user || user.isBanned || !user.isAdmin) return null;
  return user;
}

export async function sembunyikanPost(postId: number): Promise<ActionResult> {
  if (!(await guardAdmin())) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(postId)) return { ok: false, alasan: "Post tidak ditemukan." };

  const post = await prisma.post
    .update({ where: { id: postId }, data: { isHidden: true }, select: { discussionId: true } })
    .catch(() => null);
  if (!post) return { ok: false, alasan: "Post tidak ditemukan." };

  revalidatePath("/");
  revalidatePath(`/t/${post.discussionId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function tampilkanPost(postId: number): Promise<ActionResult> {
  if (!(await guardAdmin())) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(postId)) return { ok: false, alasan: "Post tidak ditemukan." };

  const post = await prisma.post
    .update({ where: { id: postId }, data: { isHidden: false }, select: { discussionId: true } })
    .catch(() => null);
  if (!post) return { ok: false, alasan: "Post tidak ditemukan." };

  revalidatePath("/");
  revalidatePath(`/t/${post.discussionId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function sembunyikanDiskusi(id: number): Promise<ActionResult> {
  if (!(await guardAdmin())) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(id)) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  const diskusi = await prisma.discussion
    .update({ where: { id }, data: { isHidden: true }, select: { id: true } })
    .catch(() => null);
  if (!diskusi) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  revalidatePath("/");
  revalidatePath(`/t/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function tampilkanDiskusi(id: number): Promise<ActionResult> {
  if (!(await guardAdmin())) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(id)) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  const diskusi = await prisma.discussion
    .update({ where: { id }, data: { isHidden: false }, select: { id: true } })
    .catch(() => null);
  if (!diskusi) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  revalidatePath("/");
  revalidatePath(`/t/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setSematkan(id: number, pinned: boolean): Promise<ActionResult> {
  if (!(await guardAdmin())) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(id)) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  const diskusi = await prisma.discussion
    .update({ where: { id }, data: { isPinned: Boolean(pinned) }, select: { id: true } })
    .catch(() => null);
  if (!diskusi) return { ok: false, alasan: "Diskusi tidak ditemukan." };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function setBan(userId: number, banned: boolean): Promise<ActionResult> {
  const admin = await guardAdmin();
  if (!admin) return { ok: false, alasan: "Khusus admin" };
  if (!Number.isInteger(userId)) return { ok: false, alasan: "User tidak ditemukan." };
  if (userId === admin.id) return { ok: false, alasan: "Tidak bisa memblokir akun sendiri." };

  if (banned) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
    if (target?.isAdmin) {
      const adminAktif = await prisma.user.count({ where: { isAdmin: true, isBanned: false } });
      if (adminAktif <= 1) return { ok: false, alasan: "Tidak bisa memblokir admin terakhir." };
    }
  }

  const user = await prisma.user
    .update({ where: { id: userId }, data: { isBanned: Boolean(banned) }, select: { id: true } })
    .catch(() => null);
  if (!user) return { ok: false, alasan: "User tidak ditemukan." };

  // Blokir harus langsung mencabut akses: sesi lama tidak boleh tetap membaca halaman privat.
  if (banned) await prisma.session.deleteMany({ where: { userId } });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}
