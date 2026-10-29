"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sukaDiskusi } from "@/app/actions/forum";
import { IkonHati } from "./Ikon";

/** Suka per diskusi. Tamu diarahkan masuk; pengguna login bisa menekan lagi
 *  untuk membatalkan. Angka diperbarui dari hasil aksi server, bukan ditebak. */
export function TombolSuka({
  discussionId,
  jumlahAwal,
  sukaAwal,
  masuk,
}: {
  discussionId: number;
  jumlahAwal: number;
  sukaAwal: boolean;
  masuk: boolean;
}) {
  const [suka, setSuka] = useState(sukaAwal);
  const [jumlah, setJumlah] = useState(jumlahAwal);
  const [galat, setGalat] = useState("");
  const [pending, mulai] = useTransition();

  const kelas = `inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-[12px] font-medium transition-colors disabled:opacity-60 ${
    suka ? "text-accent-deep" : "text-ink-faint hover:text-accent-deep"
  }`;

  if (!masuk) {
    return (
      <Link
        href="/masuk"
        className={kelas}
        aria-label={`Masuk untuk menyukai diskusi, ${jumlah} suka`}
      >
        <IkonHati className="h-3.5 w-3.5" />
        <span>Suka</span>
        <span className="tabular">{jumlah}</span>
      </Link>
    );
  }

  function klik() {
    setGalat("");
    mulai(async () => {
      const hasil = await sukaDiskusi(discussionId);
      if (hasil.ok) {
        setSuka(hasil.suka);
        setJumlah(hasil.jumlah);
      } else {
        setGalat(hasil.alasan);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={klik}
        disabled={pending}
        aria-pressed={suka}
        aria-label={
          suka ? `Batalkan suka diskusi, ${jumlah} suka` : `Suka diskusi, ${jumlah} suka`
        }
        className={kelas}
      >
        <IkonHati className="h-3.5 w-3.5" terisi={suka} />
        <span>{suka ? "Disukai" : "Suka"}</span>
        <span className="tabular">{jumlah}</span>
      </button>
      {galat && (
        <span role="alert" className="text-[12px] text-danger">
          {galat}
        </span>
      )}
    </span>
  );
}
