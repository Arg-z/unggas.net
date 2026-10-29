"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { buatDiskusi, type ActionResult } from "@/app/actions/forum";

/** Pertanyaan contoh yang berganti-ganti di placeholder judul. */
const REFERENSI_JUDUL = [
  "Kandang puyuh panas saat siang?",
  "Kenapa ayam petelur berhenti bertelur?",
  "Suhu brooder anak puyuh berapa yang pas?",
  "Kenapa cangkang telur puyuh mudah pecah?",
  "Berapa hari bebek pedaging siap panen?",
  "Pakan ayam kampung biar cepat besar apa?",
];

/** Mesin ketik sederhana: menulis satu kalimat, berhenti sejenak, menghapus,
 *  lalu lanjut ke kalimat berikutnya. Hormati preferensi gerak minim —
 *  bila aktif, tampilkan kalimat pertama utuh tanpa animasi. */
function useTeksMengetik(kalimat: string[]) {
  const [tampil, setTampil] = useState("");
  const [animasi, setAnimasi] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimasi(false);
      setTampil(kalimat[0]);
      return;
    }
    let hidup = true;
    let indeks = 0;
    let panjang = 0;
    let menghapus = false;
    let jeda: ReturnType<typeof setTimeout>;
    const langkah = () => {
      if (!hidup) return;
      const kini = kalimat[indeks];
      if (!menghapus) {
        panjang += 1;
        setTampil(kini.slice(0, panjang));
        if (panjang === kini.length) {
          menghapus = true;
          jeda = setTimeout(langkah, 2200);
          return;
        }
        jeda = setTimeout(langkah, 60);
      } else {
        panjang -= 1;
        setTampil(kini.slice(0, panjang));
        if (panjang === 0) {
          menghapus = false;
          indeks = (indeks + 1) % kalimat.length;
          jeda = setTimeout(langkah, 500);
          return;
        }
        jeda = setTimeout(langkah, 22);
      }
    };
    jeda = setTimeout(langkah, 700);
    return () => {
      hidup = false;
      clearTimeout(jeda);
    };
  }, [kalimat]);

  return { tampil, animasi };
}

export function BuatDiskusiForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(buatDiskusi, null);
  const [fokusJudul, setFokusJudul] = useState(false);
  const [judulTerisi, setJudulTerisi] = useState(false);
  const refJudul = useRef<HTMLInputElement>(null);
  const { tampil, animasi } = useTeksMengetik(REFERENSI_JUDUL);

  // Bila browser mengisi ulang nilai (mis. tombol kembali), jangan tumpuk
  // animasi di atas teks yang sudah ada.
  useEffect(() => {
    if (refJudul.current?.value) setJudulTerisi(true);
  }, []);

  const sembunyikanContoh = fokusJudul || judulTerisi;

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="block">
        <span className="label">Judul diskusi</span>
        <div className="relative mt-2">
          <input
            ref={refJudul}
            name="judul"
            required
            minLength={5}
            maxLength={200}
            className="input"
            onFocus={() => setFokusJudul(true)}
            onBlur={() => setFokusJudul(false)}
            onChange={(e) => setJudulTerisi(e.target.value.length > 0)}
          />
          {!sembunyikanContoh && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center px-3 py-2 text-[16px] leading-[1.45] text-ink-faint"
            >
              {tampil}
              {animasi && (
                <span className="kedip ml-px inline-block h-[1.15em] w-[1.5px] self-center bg-ink-faint" />
              )}
            </span>
          )}
        </div>
        <span className="hint mt-1.5 block">5–200 karakter.</span>
      </label>

      <label className="block">
        <span className="label">Isi diskusi</span>
        <textarea
          name="isi"
          required
          minLength={10}
          maxLength={20000}
          rows={9}
          className="input mt-2"
        />
      </label>

      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-rule pt-5">
        <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
          {pending ? "Menerbitkan..." : "Terbitkan diskusi"}
        </button>
      </div>
    </form>
  );
}
