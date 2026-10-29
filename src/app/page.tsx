import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pengungkap } from "@/components/Pengungkap";

export const metadata: Metadata = {
  title: { absolute: "Forum Peternak Unggas Indonesia — unggas.net" },
  description:
    "Forum peternak unggas Indonesia. Tempat bertanya dan berbagi pengalaman beternak.",
  alternates: { canonical: "https://unggas.net" },
  openGraph: {
    title: "Forum Peternak Unggas Indonesia",
    description:
      "Forum peternak unggas Indonesia. Tempat bertanya dan berbagi pengalaman beternak.",
    url: "https://unggas.net/",
    siteName: "unggas.net",
    locale: "id_ID",
    type: "website",
  },
};

const FITUR = [
  {
    judul: "Cari",
    isi: "Cari diskusi dari judulnya. Ketik kata kunci, hasilnya muncul di daftar.",
  },
  {
    judul: "Anonim",
    isi: "Identitas penulis tidak ditampilkan ke publik. Yang dibaca isinya.",
  },
  {
    judul: "Tautan",
    isi: "Tiap diskusi punya tautan buat dibagikan.",
  },
];

const tunda = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Mulai() {
  return (
    <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-[1600px] bg-ground">
      <Pengungkap />

      {/* Satu layar, hanya kata. Tidak ada navigasi batang: dua tautan kecil
          di sudut, satu pernyataan besar, satu aksi. */}
      <section
        aria-labelledby="judul-mulai"
        className="flex min-h-[100svh] flex-col justify-between px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 md:px-12 md:pb-[calc(2rem+env(safe-area-inset-bottom))]"
      >
        <header className="flex items-center justify-between gap-6 text-[14px]">
          <Link href="/" className="font-semibold tracking-tight text-ink-strong">
            unggas<span className="text-ink-faint">.net</span>
          </Link>
          <nav aria-label="Navigasi halaman" className="flex items-center gap-4 text-ink-soft sm:gap-5">
            <Link href="/diskusi" className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-accent-ink">
              Lihat diskusi
            </Link>
            <Link href="/masuk" className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-accent-ink">
              Masuk
            </Link>
          </nav>
        </header>

        <h1
          id="judul-mulai"
          className="py-[8vh] font-display text-[clamp(3rem,12vw,10.5rem)] font-semibold leading-[0.86] tracking-[-0.02em] text-ink-strong"
        >
          <span className="lp-mask block">
            <span className="lp-naik" style={{ animationDelay: "100ms" }}>
              Pertanyaan
            </span>
          </span>
          <span className="lp-mask block text-left md:text-right">
            <span className="lp-naik" style={{ animationDelay: "200ms" }}>
              tetap ada.
            </span>
          </span>
        </h1>

        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between md:gap-12">
          <p className="max-w-[44ch] text-balance text-[22px] leading-[1.4] text-ink-soft">
            Forum peternak unggas Indonesia. Tempat bertanya dan berbagi pengalaman beternak.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end md:w-auto md:shrink-0">
            <Link
              href="/daftar"
              className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center whitespace-nowrap bg-accent px-7 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover sm:w-auto"
            >
              Bikin akun
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="isinya" className="bg-accent-soft px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          <h2
            id="isinya"
            className="text-[22px] font-semibold tracking-[-0.03em] text-ink-strong md:text-[36px] lg:col-span-3"
          >
            Isinya
          </h2>

          <ul className="lg:col-span-8 lg:col-start-5">
            {FITUR.map((f, i) => (
              <li
                key={f.judul}
                className="grid gap-2 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-baseline lg:gap-10 lg:py-7"
              >
                <h3
                  data-reveal
                  style={tunda(i * 70)}
                  className="shrink-0 font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-ink-strong"
                >
                  {f.judul}
                </h3>
                <p
                  data-reveal
                  style={tunda(i * 70 + 60)}
                  className="max-w-[58ch] text-[17px] leading-[1.55] text-ink-soft"
                >
                  {f.isi}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="ajakan"
        className="flex flex-col bg-invert px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-16 text-on-invert md:px-12 md:pb-20 md:pt-20"
      >
        <h2
          id="ajakan"
          data-reveal
          className="font-display text-[clamp(3rem,12vw,10.5rem)] font-semibold leading-[0.9] tracking-[-0.02em]"
        >
          Ada yang
          <br />
          mau ditanya?
        </h2>

        <div className="mt-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-end md:gap-12">
          <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/daftar"
              className="inline-flex min-h-[52px] items-center justify-center whitespace-nowrap bg-accent px-7 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Bikin akun
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-12 md:px-12 md:pt-16">
        <p className="font-display text-[clamp(3rem,12vw,10.5rem)] font-semibold leading-none tracking-[-0.02em] text-ink-strong">
          unggas<span className="text-ink-faint">.net</span>
        </p>

        <div className="mt-10 flex flex-col gap-6 text-[14px] md:flex-row md:items-center md:justify-between">
          <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2 text-ink-soft">
            <Link href="/diskusi" className="inline-flex min-h-11 items-center transition-colors hover:text-accent-ink sm:min-h-0">
              Lihat diskusi
            </Link>
            <Link href="/daftar" className="inline-flex min-h-11 items-center transition-colors hover:text-accent-ink sm:min-h-0">
              Bikin akun
            </Link>
            <Link href="/masuk" className="inline-flex min-h-11 items-center transition-colors hover:text-accent-ink sm:min-h-0">
              Masuk
            </Link>
          </nav>
          <p className="text-ink-faint">© 2026 unggas.net</p>
        </div>
      </footer>
    </main>
  );
}
