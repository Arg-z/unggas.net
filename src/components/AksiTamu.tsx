"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Aksi tamu di bilah atas. Di halaman masuk/daftar, tautan yang sama dengan
 *  judul halaman hanya mengulang tujuan; sembunyikan supaya panel form menjadi
 *  satu-satunya aksi. */
const JALUR_TANPA_AKSI = ["/masuk", "/daftar", "/lupa-password", "/cek-email"];

export function AksiTamu() {
  const pathname = usePathname();
  const diHalamanAuth =
    JALUR_TANPA_AKSI.includes(pathname) ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verifikasi");

  if (diHalamanAuth) return null;

  return (
    <>
      <Link href="/masuk" className="btn btn-quiet">
        Masuk
      </Link>
      <Link href="/daftar" className="btn btn-primary">
        Daftar
      </Link>
    </>
  );
}
