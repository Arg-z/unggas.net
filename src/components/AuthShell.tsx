/** Bingkai halaman masuk, daftar, lupa password, dan verifikasi.
 *
 *  Satu kolom di tengah, tanpa kolom wajah di samping. Kartu putih dengan
 *  garis rambut: kepala dipisah satu garis, bukan bidang tint. */
export function AuthShell({
  judul,
  sub,
  children,
}: {
  judul: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
          <h1 className="font-display text-[23px] font-semibold leading-tight tracking-tight text-ink-strong">
            {judul}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{sub}</p>
        </div>
        <section className="px-5 py-5 sm:px-6 sm:py-6">{children}</section>
      </div>
    </div>
  );
}
