"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { IkonAdmin, IkonBalasan, IkonIndeks, IkonNotifikasi, IkonTulis } from "./Ikon";

/* Navigasi utama. Baris aktif netral dengan ikon hijau; hijau penuh hanya di
   angka notifikasi. Tidak ada garis kiri atau tint besar. */
export function NavSamping({
  isAdmin,
  masuk,
  belumDibaca = 0,
  ponsel = false,
}: {
  isAdmin: boolean;
  masuk: boolean;
  belumDibaca?: number;
  ponsel?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
      <p className="px-2.5 pb-1.5 text-[12px] font-medium text-ink-faint">Forum</p>
      <Baris href="/diskusi" aktif={pathname === "/diskusi"} ikon={<IkonIndeks />} ponsel={ponsel}>
        Semua diskusi
      </Baris>
      <Baris
        href="/notifikasi"
        aktif={pathname === "/notifikasi"}
        ikon={<IkonNotifikasi />}
        ponsel={ponsel}
        angka={belumDibaca}
      >
        Notifikasi
      </Baris>
      <Baris href="/baru" aktif={pathname === "/baru"} ikon={<IkonTulis />} ponsel={ponsel}>
        Tulis diskusi
      </Baris>
      {masuk && (
        <Baris href="/postingan" aktif={pathname === "/postingan"} ikon={<IkonBalasan />} ponsel={ponsel}>
          Postingan saya
        </Baris>
      )}
      {isAdmin && (
        <Baris href="/admin" aktif={pathname === "/admin"} ikon={<IkonAdmin />} ponsel={ponsel}>
          Panel admin
        </Baris>
      )}
    </nav>
  );
}

function Baris({
  href,
  aktif,
  ikon,
  children,
  ponsel,
  angka = 0,
}: {
  href: string;
  aktif: boolean;
  ikon: ReactNode;
  children: ReactNode;
  ponsel: boolean;
  angka?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 text-[14px] transition-colors active:bg-wash ${
        ponsel ? "h-11" : "h-9"
      } ${
        aktif
          ? "bg-wash font-semibold text-ink-strong"
          : "font-medium text-ink-soft hover:bg-wash hover:text-ink-strong"
      }`}
    >
      <span className={`shrink-0 ${aktif ? "text-accent" : "text-ink-faint"}`}>{ikon}</span>
      <span className="truncate">{children}</span>
      {angka > 0 && (
        <span className="tabular ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10.5px] font-bold leading-none text-white">
          {angka > 9 ? "9+" : angka}
        </span>
      )}
    </Link>
  );
}
