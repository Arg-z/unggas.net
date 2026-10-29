"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, perluRehash, verifyPassword } from "@/lib/password";
import { validateSignup, validateSignupTanpaEmail } from "@/lib/validate";
import { emailAktif, emailInternal } from "@/lib/fitur";
import { createSession, destroySession, getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { buatToken, pakaiToken } from "@/lib/emailtoken";
import { emailResetPassword, emailVerifikasi, kirimEmail } from "@/lib/email";

export type ActionResult = { ok: true } | { ok: false; alasan: string };

type LoginRow = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  isBanned: boolean;
  emailVerifiedAt: Date | null;
};

// Pembatasan percobaan masuk (anti brute-force): 5/menit per identitas, 20/menit per IP.
const LIMIT_IDENTITAS = 5;
const LIMIT_IP = 20;
const JENDELA_MS = 60_000;

// Email keluar dibatasi lebih ketat supaya tidak bisa dipakai membanjiri inbox orang.
const LIMIT_EMAIL_IP = 5;
const LIMIT_EMAIL_ALAMAT = 3;
const JENDELA_EMAIL_MS = 10 * 60_000;

// Pendaftaran dibatasi supaya tidak bisa dipakai menumpuk akun / memicu email massal.
const LIMIT_DAFTAR_IP = 5;
const JENDELA_DAFTAR_MS = 10 * 60_000;

/** IP pengirim untuk pembatasan percobaan. Origin hanya menerima koneksi dari
 *  Cloudflare, jadi CF-Connecting-IP adalah IP pengunjung yang bisa dipercaya;
 *  X-Real-IP dipakai untuk akses langsung lewat localhost/tailnet. */
async function ipPengirim(): Promise<string> {
  try {
    const h = await headers();
    const ip =
      h.get("cf-connecting-ip") ??
      h.get("x-real-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return ip?.trim() || "tanpa-ip";
  } catch {
    return "tanpa-ip";
  }
}

/** Guard untuk Server Action yang datang dari build lama (formData bisa undefined). */
function sesiKedaluwarsa(formData: FormData | undefined): ActionResult | null {
  return formData ? null : { ok: false, alasan: "Halaman sudah usang. Muat ulang lalu coba lagi." };
}

async function bolehKirimEmail(alamat: string): Promise<boolean> {
  const ip = await ipPengirim();
  const bolehIp = rateLimit(`email:ip:${ip}`, LIMIT_EMAIL_IP, JENDELA_EMAIL_MS);
  const bolehAlamat = rateLimit(`email:alamat:${alamat}`, LIMIT_EMAIL_ALAMAT, JENDELA_EMAIL_MS);
  return bolehIp && bolehAlamat;
}

export async function daftar(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  if (!rateLimit(`daftar:ip:${await ipPengirim()}`, LIMIT_DAFTAR_IP, JENDELA_DAFTAR_MS)) {
    return { ok: false, alasan: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi beberapa menit lagi." };
  }

  const emailNyala = emailAktif();
  const isian = {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    honeypot: String(formData.get("website") ?? ""),
  };

  let username: string;
  let email: string;
  let password: string;

  if (emailNyala) {
    const hasil = validateSignup({ ...isian, email: String(formData.get("email") ?? "") });
    if (!hasil.ok) return hasil;
    ({ username, email, password } = hasil);
  } else {
    const hasil = validateSignupTanpaEmail(isian);
    if (!hasil.ok) return hasil;
    ({ username, password } = hasil);
    email = emailInternal(username);
  }

  // Cek bentrok username tanpa peduli besar-kecil. Jangan pakai mode "insensitive":
  // Prisma menerjemahkannya ke ILIKE sehingga "%" dan "_" jadi wildcard.
  const [bentrok] = await prisma.$queryRaw<{ username: string; email: string }[]>`
    SELECT username, email
    FROM users
    WHERE lower(username) = ${username.toLowerCase()} OR email = ${email}
    LIMIT 1
  `;
  if (bentrok) {
    return {
      ok: false,
      alasan: emailNyala && bentrok.email === email ? "Email sudah terdaftar" : "Username sudah dipakai",
    };
  }

  // Saat email nyala, pendaftaran mengirim email verifikasi — ikut batas anti-spam.
  if (emailNyala && !(await bolehKirimEmail(email))) {
    return { ok: false, alasan: "Terlalu banyak permintaan email. Tunggu beberapa menit lalu coba lagi." };
  }

  const user = await prisma.user
    .create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
        // Saat email dimatikan, akun langsung aktif supaya bisa dipakai tanpa verifikasi.
        emailVerifiedAt: emailNyala ? null : new Date(),
      },
    })
    // Dua pendaftaran bersamaan bisa lolos cek bentrok; unique index yang menangkap.
    .catch((galat) => {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === "P2002") return null;
      throw galat;
    });
  if (!user) {
    return {
      ok: false,
      alasan: emailNyala ? "Username atau email sudah dipakai" : "Username sudah dipakai",
    };
  }

  if (!emailNyala) {
    await createSession(user.id);
    redirect("/diskusi");
  }

  const token = await buatToken(user.id, "verifikasi");
  await kirimEmail({ ke: user.email, ...emailVerifikasi(user.username, token) });

  // Belum ada sesi — login baru bisa setelah email diverifikasi.
  redirect("/cek-email");
}

export async function masuk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  const emailNyala = emailAktif();
  const identitas = String(formData.get("identitas") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!identitas || !password) return { ok: false, alasan: "Isi username dan password" };

  const bolehIp = rateLimit(`masuk:ip:${await ipPengirim()}`, LIMIT_IP, JENDELA_MS);
  const bolehIdentitas = rateLimit(`masuk:identitas:${identitas}`, LIMIT_IDENTITAS, JENDELA_MS);
  if (!bolehIp || !bolehIdentitas) {
    return { ok: false, alasan: "Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi." };
  }

  // Bandingkan username sebagai nilai, bukan pola. mode "insensitive" di Prisma
  // menjadi ILIKE: input "%" atau "_" bisa mencocokkan akun lain dan melewati
  // throttle per-identitas. Query parameter ini memakai lower() tanpa wildcard.
  const [user] = await prisma.$queryRaw<LoginRow[]>`
    SELECT id, username, email,
           "passwordHash",
           is_admin AS "isAdmin",
           is_banned AS "isBanned",
           email_verified_at AS "emailVerifiedAt"
    FROM users
    WHERE lower(username) = ${identitas} OR email = ${identitas}
    LIMIT 1
  `;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, alasan: emailNyala ? "Username/email atau password salah" : "Username atau password salah" };
  }
  if (user.isBanned) return { ok: false, alasan: "Akun ini diblokir. Hubungi admin." };
  if (emailNyala && !user.emailVerifiedAt) {
    return {
      ok: false,
      alasan: "Akun belum diverifikasi. Buka tautan di email kami, atau kirim ulang di /cek-email.",
    };
  }

  // Upgrade hash lama (cost < 12) ke cost baru secara transparan.
  // Gagal upgrade tidak menggagalkan login: hash lama tetap valid.
  if (perluRehash(user.passwordHash)) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      });
    } catch {
      // Abaikan: login tetap jalan.
    }
  }

  await createSession(user.id);
  redirect("/diskusi");
}

export async function keluar(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Kirim tautan reset password. Selalu balas netral agar email tidak bisa ditebak. */
export async function lupaPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  if (!emailAktif()) {
    return { ok: false, alasan: "Lupa password sedang dimatikan. Hubungi admin untuk mereset password akunmu." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, alasan: "Isi alamat email" };
  if (!(await bolehKirimEmail(email))) {
    return { ok: false, alasan: "Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isBanned) {
    const token = await buatToken(user.id, "reset");
    await kirimEmail({ ke: user.email, ...emailResetPassword(user.username, token) });
  }

  return { ok: true };
}

/** Simpan password baru dari tautan reset. */
export async function resetPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  if (!emailAktif()) {
    return { ok: false, alasan: "Reset password lewat email sedang dimatikan. Hubungi admin untuk mereset password akunmu." };
  }

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const ulangi = String(formData.get("ulangi") ?? "");

  if (password.length < 8) return { ok: false, alasan: "Password minimal 8 karakter" };
  if (password !== ulangi) return { ok: false, alasan: "Dua password tidak sama" };

  const userId = await pakaiToken(token, "reset");
  if (userId === null) {
    return { ok: false, alasan: "Tautan tidak berlaku atau sudah kedaluwarsa. Minta tautan baru." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });
  // Semua sesi lama diputus: kalau password diganti karena akun dibajak,
  // penyerang ikut terlempar keluar.
  await prisma.session.deleteMany({ where: { userId } });

  redirect("/masuk?reset=1");
}

/** Kirim ulang tautan verifikasi untuk akun yang belum aktif. */
export async function kirimUlangVerifikasi(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!emailAktif()) {
    return { ok: false, alasan: "Verifikasi email sedang dimatikan. Akun baru langsung aktif saat mendaftar." };
  }

  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, alasan: "Isi alamat email" };
  if (!(await bolehKirimEmail(email))) {
    return { ok: false, alasan: "Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isBanned && !user.emailVerifiedAt) {
    const token = await buatToken(user.id, "verifikasi");
    await kirimEmail({ ke: user.email, ...emailVerifikasi(user.username, token) });
  }

  return { ok: true };
}

/** Aktifkan akun dari tautan verifikasi. */
export async function aktifkanAkun(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!emailAktif()) redirect("/masuk");

  const usang = sesiKedaluwarsa(formData);
  if (usang) return usang;

  const token = String(formData.get("token") ?? "");
  const userId = await pakaiToken(token, "verifikasi");
  if (userId === null) {
    return { ok: false, alasan: "Tautan tidak berlaku atau sudah kedaluwarsa. Minta tautan baru." };
  }

  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  redirect("/masuk?verified=1");
}
