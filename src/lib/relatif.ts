/** Waktu relatif bahasa Indonesia: "5 menit lalu", "3 jam lalu", dst. */
export function relatif(date: Date, now: number = Date.now()): string {
  const selisih = now - date.getTime();
  const menit = Math.floor(selisih / 60_000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.floor(bulan / 12)} tahun lalu`;
}
