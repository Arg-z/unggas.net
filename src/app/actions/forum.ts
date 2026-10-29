"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { rateLimit } from "@/lib/ratelimit";

export type ActionResult = { ok: true } | { ok: false; alasan: string };

const MINGGU_MS = 7 * 24 * 60 * 60 * 1000;

export async function buatDiskusi(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, alasan: "Masuk dulu untuk membuat diskusi." };

  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();

  if (judul.length < 5 || judul.length > 200) return { ok: false, alasan: "Judul 5-200 karakter." };
  if (isi.length < 10 || isi.length > 20_000) return { ok: false, alasan: "Isi diskusi 10-20.000 karakter." };

  const akunBaru = Date.now() - new Date((await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { createdAt: true } })).createdAt).getTime() < MINGGU_MS;
  const limit = akunBaru ? 1 : 5;
  if (!rateLimit(`diskusi:${user.id}`, limit, 60_000)) {
    return { ok: false, alasan: akunBaru ? "Akun baru: maksimal 1 diskusi per menit." : "Maksimal 5 diskusi per menit." };
  }

  const discussion = await prisma.discussion.create({
    data: {
      userId: user.id,
      title: judul,
      posts: { create: { userId: user.id, number: 1, content: isi } },
    },
    select: { id: true },
  });

  revalidatePath("/");
  redirect(`/t/${discussion.id}`);
}

export async function balas(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, alasan: "Masuk dulu untuk membalas." };

  const discussionId = Number(formData.get("discussionId"));
  const content = String(formData.get("content") ?? "").trim();
  if (!Number.isFinite(discussionId)) return { ok: false, alasan: "Diskusi tidak dikenal." };
  if (content.length < 2 || content.length > 20_000) return { ok: false, alasan: "Balasan 2-20.000 karakter." };

  if (!rateLimit(`balas:${user.id}`, 10, 60_000)) {
    return { ok: false, alasan: "Terlalu cepat — tunggu sebentar." };
  }

  // Diskusi tersembunyi tidak boleh dibalas lewat URL langsung oleh non-admin.
  const diskusi = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { isHidden: true },
  });
  if (!diskusi || (diskusi.isHidden && !user.isAdmin)) {
    return { ok: false, alasan: "Diskusi tidak ditemukan." };
  }

  // Nomor post dihitung dari max+1. Dua balasan bersamaan bisa memilih nomor
  // yang sama dan menabrak @@unique([discussionId, number]); yang kalah coba
  // ulang dengan nomor baru alih-alih dibuang.
  let nomorPost = 0;
  let tersimpan = false;
  for (let percobaan = 0; percobaan < 3 && !tersimpan; percobaan++) {
    const last = await prisma.post.aggregate({
      where: { discussionId },
      _max: { number: true },
    });
    nomorPost = (last._max.number ?? 0) + 1;

    try {
      await prisma.$transaction([
        prisma.post.create({
          data: { discussionId, userId: user.id, number: nomorPost, content },
        }),
        prisma.discussion.update({ where: { id: discussionId }, data: { lastPostAt: new Date() } }),
      ]);
      tersimpan = true;
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === "P2002") continue;
      return { ok: false, alasan: "Diskusi tidak ditemukan." };
    }
  }
  if (!tersimpan) {
    return { ok: false, alasan: "Terlalu banyak balasan bersamaan. Coba lagi." };
  }

  // Notifikasi in-app ke penulis diskusi (bukan ke diri sendiri; penulis banned diabaikan).
  try {
    const d = await prisma.discussion.findUnique({
      where: { id: discussionId },
      select: { userId: true, user: { select: { isBanned: true } } },
    });
    if (d && d.userId !== user.id && !d.user.isBanned) {
      await prisma.notification.create({
        data: { userId: d.userId, actorId: user.id, discussionId, postNumber: nomorPost },
      });
    }
  } catch {
    // balasan sudah tersimpan — notifikasi gagal diabaikan
  }

  revalidatePath(`/t/${discussionId}`);
  return { ok: true };
}

export type HasilSuka =
  | { ok: true; suka: boolean; jumlah: number }
  | { ok: false; alasan: string };

export async function sukaDiskusi(discussionId: number): Promise<HasilSuka> {
  const user = await requireUser();
  if (!user) return { ok: false, alasan: "Masuk dulu untuk menyukai diskusi." };
  if (!Number.isSafeInteger(discussionId) || discussionId <= 0) {
    return { ok: false, alasan: "Diskusi tidak dikenal." };
  }

  if (!rateLimit(`suka:${user.id}`, 20, 60_000)) {
    return { ok: false, alasan: "Terlalu cepat — tunggu sebentar." };
  }

  const diskusi = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { isHidden: true },
  });
  if (!diskusi || (diskusi.isHidden && !user.isAdmin)) {
    return { ok: false, alasan: "Diskusi tidak ditemukan." };
  }

  // Toggle: kalau sudah ada, hapus; kalau belum, simpan. Balapan antar klik
  // ditangani lewat unique index — yang kalah dianggap sudah menyukai.
  const dihapus = await prisma.like.deleteMany({
    where: { discussionId, userId: user.id },
  });

  let suka = false;
  if (dihapus.count === 0) {
    try {
      await prisma.like.create({ data: { discussionId, userId: user.id } });
      suka = true;
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === "P2002") {
        suka = true;
      } else {
        return { ok: false, alasan: "Gagal menyimpan suka. Coba lagi." };
      }
    }
  }

  const jumlah = await prisma.like.count({ where: { discussionId } });
  revalidatePath(`/t/${discussionId}`);
  revalidatePath("/diskusi");
  return { ok: true, suka, jumlah };
}

export type HasilHapusPost =
  | { ok: true; hapusDiskusi: boolean }
  | { ok: false; alasan: string };

export async function hapusPost(postId: number): Promise<HasilHapusPost> {
  const user = await requireUser();
  if (!user) return { ok: false, alasan: "Masuk dulu untuk menghapus." };
  if (!Number.isSafeInteger(postId) || postId <= 0) {
    return { ok: false, alasan: "Post tidak dikenal." };
  }

  if (!rateLimit(`hapus:${user.id}`, 10, 60_000)) {
    return { ok: false, alasan: "Terlalu cepat — tunggu sebentar." };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true, number: true, discussionId: true },
  });
  if (!post) return { ok: false, alasan: "Post tidak ditemukan." };
  if (post.userId !== user.id && !user.isAdmin) {
    return { ok: false, alasan: "Hanya tulisanmu sendiri yang bisa kamu hapus." };
  }

  // Post #1 adalah isi topik — menghapusnya sama dengan menghapus diskusi,
  // karena judul tanpa isi tidak boleh ditinggal. Cascade membersihkan
  // balasan, suka, dan notifikasi milik diskusi itu.
  if (post.number === 1) {
    await prisma.discussion.delete({ where: { id: post.discussionId } });
    revalidatePath("/");
    revalidatePath("/diskusi");
    return { ok: true, hapusDiskusi: true };
  }

  await prisma.$transaction([
    prisma.post.delete({ where: { id: postId } }),
    // Notifikasi "X membalas diskusimu" yang menunjuk balasan ini ikut hilang.
    prisma.notification.deleteMany({
      where: { discussionId: post.discussionId, postNumber: post.number },
    }),
  ]);
  revalidatePath(`/t/${post.discussionId}`);
  revalidatePath("/");
  return { ok: true, hapusDiskusi: false };
}

export async function hapusDiskusi(discussionId: number): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, alasan: "Masuk dulu untuk menghapus." };
  if (!Number.isSafeInteger(discussionId) || discussionId <= 0) {
    return { ok: false, alasan: "Diskusi tidak dikenal." };
  }

  if (!rateLimit(`hapus:${user.id}`, 10, 60_000)) {
    return { ok: false, alasan: "Terlalu cepat — tunggu sebentar." };
  }

  const diskusi = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { userId: true },
  });
  if (!diskusi) return { ok: false, alasan: "Diskusi tidak ditemukan." };
  if (diskusi.userId !== user.id && !user.isAdmin) {
    return { ok: false, alasan: "Hanya diskusimu sendiri yang bisa kamu hapus." };
  }

  await prisma.discussion.delete({ where: { id: discussionId } });
  revalidatePath("/");
  revalidatePath("/diskusi");
  return { ok: true };
}
