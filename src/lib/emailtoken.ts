import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

/**
 * Token sekali-pakai untuk verifikasi email dan reset password.
 *
 * Yang disimpan di database hanya hash SHA-256. Token mentah cuma ada di
 * tautan yang dikirim lewat email, jadi bocornya isi tabel tidak cukup
 * untuk membajak akun.
 */

export const JENIS_TOKEN = ["verifikasi", "reset"] as const;
export type JenisToken = (typeof JENIS_TOKEN)[number];

const MASA_BERLAKU_MS: Record<JenisToken, number> = {
  verifikasi: 24 * 60 * 60 * 1000, // 24 jam
  reset: 60 * 60 * 1000, // 1 jam — lebih pendek karena lebih sensitif
};

/** Hash SHA-256 hex; hanya ini yang disimpan. */
export function hashToken(mentah: string): string {
  return createHash("sha256").update(mentah).digest("hex");
}

/** Token mentah selalu 64 karakter hex (32 byte acak). */
export function bentukTokenValid(mentah: string): boolean {
  return /^[a-f0-9]{64}$/.test(mentah);
}

/** Waktu kedaluwarsa untuk jenis token tertentu. */
export function kedaluwarsa(jenis: JenisToken, mulai: number = Date.now()): Date {
  return new Date(mulai + MASA_BERLAKU_MS[jenis]);
}

/**
 * Buat token baru untuk user. Token lama yang belum terpakai untuk jenis yang
 * sama dihapus, jadi hanya tautan terbaru yang berlaku.
 */
export async function buatToken(userId: number, jenis: JenisToken): Promise<string> {
  const mentah = randomBytes(32).toString("hex");
  await prisma.emailToken.deleteMany({ where: { userId, kind: jenis, usedAt: null } });
  await prisma.emailToken.create({
    data: { userId, kind: jenis, tokenHash: hashToken(mentah), expiresAt: kedaluwarsa(jenis) },
  });
  return mentah;
}

/**
 * Cek token tanpa memakainya — dipakai halaman untuk menolak tautan mati
 * sebelum pengguna mengisi formulir.
 */
export async function tokenMasihBerlaku(mentah: string, jenis: JenisToken): Promise<boolean> {
  if (!bentukTokenValid(mentah)) return false;
  const baris = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(mentah) } });
  return !!baris && baris.kind === jenis && !baris.usedAt && baris.expiresAt >= new Date();
}

/**
 * Pakai token: kembalikan userId kalau valid, null kalau tidak.
 * Token langsung ditandai terpakai sehingga tidak bisa dipakai dua kali.
 */
export async function pakaiToken(mentah: string, jenis: JenisToken): Promise<number | null> {
  if (!bentukTokenValid(mentah)) return null;

  const baris = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(mentah) } });
  if (!baris || baris.kind !== jenis || baris.usedAt || baris.expiresAt < new Date()) return null;

  // Guard usedAt: null di WHERE membuat dua permintaan bersamaan tidak bisa
  // sama-sama berhasil memakai token yang sama.
  const hasil = await prisma.emailToken.updateMany({
    where: { id: baris.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return hasil.count === 1 ? baris.userId : null;
}
