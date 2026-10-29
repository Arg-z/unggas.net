"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonPlus } from "./Ikon";

/** Satu aksi utama per layar: di halaman menulis, tombol ini diam karena
 *  tombol Terbitkan sudah memegang peran itu. */
export function TombolTulis() {
  const pathname = usePathname();
  if (pathname === "/baru") return null;

  return (
    <Link
      href="/baru"
      aria-label="Tulis diskusi"
      className="btn btn-primary h-11 w-11 shrink-0 px-0 md:h-9 md:w-auto md:px-3"
    >
      <IkonPlus />
      <span className="hidden md:inline">Tulis diskusi</span>
    </Link>
  );
}
