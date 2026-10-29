"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Kartu tamu di kaki sidebar dan di lembar menu ponsel. Di halaman masuk,
 *  daftar, dan reset, tautan yang sama dengan judul halaman hanya mengulang
 *  tujuan; kartu disembunyikan supaya panel form menjadi satu-satunya aksi. */
const JALUR_TANPA_AJAKAN = ["/masuk", "/daftar", "/lupa-password", "/cek-email"];

export function KartuTamu() {
  const pathname = usePathname();
  const diHalamanAuth =
    JALUR_TANPA_AJAKAN.includes(pathname) ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verifikasi");

  if (diHalamanAuth) return null;

  return (
    <div className="rounded-xl border border-border p-3.5">
      <p className="text-[13px] font-semibold text-ink-strong">Ikut berdiskusi</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
        Forum peternak unggas Indonesia.
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/masuk" className="btn btn-outline btn-sm flex-1">
          Masuk
        </Link>
        <Link href="/daftar" className="btn btn-primary btn-sm flex-1">
          Daftar
        </Link>
      </div>
    </div>
  );
}
