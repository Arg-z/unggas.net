"use client";

import { usePathname, useSearchParams } from "next/navigation";

/** Halaman yang tampil tanpa kerangka forum: sidebar, bilah ponsel, dan footer
 *  tidak ikut dirender. Semua bagian kerangka tetap dirender di server lalu
 *  dioper sebagai node, jadi tidak ada data atau aksi yang pindah ke klien. */
const TANPA_KERANGKA = new Set(["/"]);

export function Bingkai({
  samping,
  bilah,
  kaki,
  children,
}: {
  samping: React.ReactNode;
  bilah: React.ReactNode;
  kaki: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  // Link hasil tombol Bagikan memakai ?fokus=1: pembaca hanya melihat thread.
  const fokus = pathname.startsWith("/t/") && sp.get("fokus") === "1";

  if (TANPA_KERANGKA.has(pathname)) return <>{children}</>;

  if (fokus) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        {children}
      </div>
    );
  }

  return (
    <div className="lg:flex lg:min-h-screen">
      {samping}
      <div className="min-w-0 flex-1">
        {bilah}
        <div className="mx-auto w-full max-w-[1080px] px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 lg:px-12 lg:pt-10">
          {children}
          {kaki}
        </div>
      </div>
    </div>
  );
}
