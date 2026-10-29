/**
 * Sakelar sementara untuk fitur email: verifikasi pendaftaran dan reset password.
 *
 * Default mati. Nyalakan lagi dengan menambahkan `EMAIL_AKTIF=true` di `.env`
 * lalu restart proses. Selama mati, pendaftaran tidak meminta email, akun
 * langsung aktif, dan semua halaman terkait email dialihkan ke /masuk.
 */
export function emailAktif(): boolean {
  return process.env.EMAIL_AKTIF === "true";
}

/** Alamat internal pengganti email untuk akun yang didaftarkan saat fitur email mati. */
export function emailInternal(username: string): string {
  return `${username.toLowerCase()}@unggas.local`;
}
