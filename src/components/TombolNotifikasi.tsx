"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonNotifikasi } from "./Ikon";

/** Lonceng notifikasi berperilaku sebagai saklar: menekannya membuka halaman
 *  notifikasi; kalau halaman itu sedang terbuka, menekan lagi menutupnya dan
 *  kembali ke daftar diskusi. */
export function TombolNotifikasi({ belumDibaca }: { belumDibaca: number }) {
  const pathname = usePathname();
  const aktif = pathname === "/notifikasi";

  return (
    <Link
      href={aktif ? "/diskusi" : "/notifikasi"}
      aria-current={aktif ? "page" : undefined}
      aria-label={
        aktif
          ? "Tutup notifikasi"
          : belumDibaca > 0
            ? `Notifikasi, ${belumDibaca} belum dibaca`
            : "Notifikasi"
      }
      title="Notifikasi"
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-sunken hover:text-ink-strong active:bg-sunken ${
        aktif ? "bg-sunken text-ink-strong" : ""
      }`}
    >
      <IkonNotifikasi className="h-[19px] w-[19px]" />
      {belumDibaca > 0 && (
        <span className="tabular absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-bold leading-none text-white ring-2 ring-ground">
          {belumDibaca > 9 ? "9+" : belumDibaca}
        </span>
      )}
    </Link>
  );
}
