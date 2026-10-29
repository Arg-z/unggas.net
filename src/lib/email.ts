import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Pengiriman email transaksional lewat Amazon SES (region ap-southeast-1).
 *
 * Kredensial tidak disimpan di kode: di server memakai IAM role instance,
 * di laptop memakai rantai kredensial bawaan AWS SDK (env / ~/.aws).
 * Semua email dikirim sebagai teks biasa — tidak ada HTML, tidak ada tracking.
 */

const REGION = process.env.SES_REGION ?? "ap-southeast-1";
const PENGIRIM = process.env.SES_FROM ?? "unggas.net <no-reply@unggas.net>";
const APP_URL = process.env.APP_URL ?? "https://unggas.net";

let klien: SESv2Client | null = null;

function ses(): SESv2Client {
  klien ??= new SESv2Client({ region: REGION });
  return klien;
}

/** URL absolut untuk tautan di dalam email. */
export function tautan(path: string): string {
  return `${APP_URL.replace(/\/$/, "")}${path}`;
}

export type Email = { ke: string; subjek: string; isi: string };
type IsiEmail = Omit<Email, "ke">;

/**
 * Kirim satu email. Mengembalikan false kalau gagal — pemanggil tidak boleh
 * menggagalkan seluruh alur hanya karena email tidak terkirim.
 */
export async function kirimEmail({ ke, subjek, isi }: Email): Promise<boolean> {
  try {
    await ses().send(
      new SendEmailCommand({
        FromEmailAddress: PENGIRIM,
        Destination: { ToAddresses: [ke] },
        Content: {
          Simple: {
            Subject: { Data: subjek, Charset: "UTF-8" },
            Body: { Text: { Data: isi, Charset: "UTF-8" } },
          },
        },
      }),
    );
    return true;
  } catch (galat) {
    const pesan = galat instanceof Error ? galat.message : String(galat);
    console.error(`[email] gagal mengirim ke ${ke}: ${pesan}`);
    return false;
  }
}

/** Email berisi tautan verifikasi akun. */
export function emailVerifikasi(username: string, token: string): IsiEmail {
  return {
    subjek: "Verifikasi email kamu di unggas.net",
    isi: [
      `Halo ${username},`,
      "",
      "Terima kasih sudah mendaftar di unggas.net — forum peternak unggas.",
      "Klik tautan di bawah untuk mengaktifkan akun kamu:",
      "",
      tautan(`/verifikasi/${token}`),
      "",
      "Tautan ini berlaku 24 jam dan hanya bisa dipakai sekali.",
      "Kalau kamu tidak merasa mendaftar, abaikan saja email ini — akun tidak akan aktif.",
      "",
      "-- unggas.net",
    ].join("\n"),
  };
}

/** Email berisi tautan reset password. */
export function emailResetPassword(username: string, token: string): IsiEmail {
  return {
    subjek: "Atur ulang password unggas.net",
    isi: [
      `Halo ${username},`,
      "",
      "Ada permintaan untuk mengatur ulang password akun kamu di unggas.net.",
      "Klik tautan di bawah untuk membuat password baru:",
      "",
      tautan(`/reset-password/${token}`),
      "",
      "Tautan ini berlaku 1 jam dan hanya bisa dipakai sekali.",
      "Kalau kamu tidak meminta ini, abaikan saja email ini — password kamu tidak berubah.",
      "",
      "-- unggas.net",
    ].join("\n"),
  };
}

