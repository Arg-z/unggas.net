"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Kontrol urutan di toolbar daftar. Nilainya parameter URL nyata (`?urut=`),
 * jadi urutan bisa dibagikan dan bertahan saat halaman dimuat ulang.
 */
export function Pemilih({
  param,
  nilai,
  opsi,
  ariaLabel,
  lebar = "w-[132px]",
}: {
  param: string;
  nilai: string;
  opsi: { nilai: string; label: string }[];
  ariaLabel: string;
  lebar?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function ubah(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(sp.toString());
    if (e.target.value) next.set(param, e.target.value);
    else next.delete(param);
    next.delete("page");
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  }

  return (
    <select
      aria-label={ariaLabel}
      value={nilai}
      onChange={ubah}
      className={`input h-8 min-h-0 cursor-pointer py-0 pl-2 pr-7 text-[13px] font-medium text-ink-soft ${lebar}`}
    >
      {opsi.map((o) => (
        <option key={o.nilai} value={o.nilai}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
