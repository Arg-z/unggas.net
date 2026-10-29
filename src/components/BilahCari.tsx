"use client";

import { useSearchParams } from "next/navigation";
import { IkonCari } from "./Ikon";

/** Pencarian di bilah atas: form GET biasa ke beranda, jadi tetap bekerja
 *  tanpa JavaScript dan URL-nya bisa dibagikan. Filter yang sedang aktif ikut
 *  dibawa, supaya mencari dari satu topik tidak diam-diam melebar ke semua. */
export function BilahCari({ penuh = false }: { penuh?: boolean }) {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const saring = sp.get("saring");
  const urut = sp.get("urut");

  return (
    <form action="/diskusi" role="search" className={`relative ${penuh ? "w-full" : "w-[300px]"}`}>
      {saring && <input type="hidden" name="saring" value={saring} />}
      {urut && <input type="hidden" name="urut" value={urut} />}
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint">
        <IkonCari className="h-[15px] w-[15px]" />
      </span>
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Cari judul diskusi"
        aria-label="Cari diskusi"
        className={`w-full rounded-lg border border-control bg-surface pl-8 pr-2.5 text-[16px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 sm:text-[13px] ${
          penuh ? "h-11 sm:h-9" : "h-8"
        }`}
      />
    </form>
  );
}
