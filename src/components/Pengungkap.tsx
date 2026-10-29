"use client";

import { useEffect } from "react";

/** Menyalakan reveal saat elemen masuk layar. Kelas penanda dipasang dari
 *  efek, bukan dari HTML, supaya isi tetap terlihat kalau JavaScript gagal
 *  atau pengunjung meminta gerak dikurangi. */
export function Pengungkap() {
  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const akar = document.documentElement;
    akar.classList.add("lp-gerak");

    const pengamat = new IntersectionObserver(
      (entri) => {
        for (const entriIni of entri) {
          if (!entriIni.isIntersecting) continue;
          entriIni.target.classList.add("is-in");
          pengamat.unobserve(entriIni.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    const sasaran = document.querySelectorAll("[data-reveal]");
    sasaran.forEach((el) => pengamat.observe(el));

    return () => {
      pengamat.disconnect();
      akar.classList.remove("lp-gerak");
    };
  }, []);

  return null;
}
