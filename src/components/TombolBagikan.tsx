"use client";

import { useState } from "react";
import { IkonTautan } from "./Ikon";

type Status = "diam" | "tersalin" | "gagal";

/** Tombol bagikan: menyalin URL diskusi dengan mode fokus, tanpa hash atau
 *  query lain. Clipboard API dipakai bila ada; kalau tidak, fallback ke
 *  textarea sementara supaya tetap jalan di browser lama. */
export function TombolBagikan({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("diam");

  async function salin() {
    const url = `${window.location.origin}${window.location.pathname}?fokus=1`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const area = document.createElement("textarea");
        area.value = url;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const berhasil = document.execCommand("copy");
        document.body.removeChild(area);
        if (!berhasil) throw new Error("gagal menyalin");
      }
      setStatus("tersalin");
      window.setTimeout(() => setStatus("diam"), 2000);
    } catch {
      setStatus("gagal");
      window.setTimeout(() => setStatus("diam"), 2500);
    }
  }

  return (
    <button
      type="button"
      data-bagikan
      onClick={salin}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-[12px] font-medium transition-colors hover:text-accent-deep ${
        status === "tersalin" ? "text-accent-deep" : ""
      } ${className}`}
    >
      <IkonTautan className="h-3.5 w-3.5" />
      <span aria-live="polite">
        {status === "tersalin"
          ? "Tautan disalin"
          : status === "gagal"
            ? "Gagal menyalin"
            : "Bagikan"}
      </span>
    </button>
  );
}
