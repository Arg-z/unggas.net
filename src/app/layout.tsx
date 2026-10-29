import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NotifikasiBadge } from "@/components/NotifikasiBadge";
import { Avatar } from "@/components/Avatar";
import { Wordmark } from "@/components/Wordmark";
import { NavSamping } from "@/components/NavSamping";
import { BilahCari } from "@/components/BilahCari";
import { KartuTamu } from "@/components/KartuTamu";
import { MenuPonsel } from "@/components/MenuPonsel";
import { TombolTulis } from "@/components/TombolTulis";
import { IkonKeluar } from "@/components/Ikon";
import { Bingkai } from "@/components/Bingkai";
import { MetaTema, SkripTema, TombolTema } from "@/components/Tema";
import { keluar } from "./actions/auth";

/* Serif untuk identitas & permukaan baca, sans humanist untuk UI.
   Fraunces punya optical sizing (opsz) — tajam besar di judul, nyaman kecil di prosa.
   Plus Jakarta Sans (Tokotype, Indonesia) untuk semua teks UI.
   Keduanya self-hosted via next/font, tanpa request runtime. */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Forum Peternak Unggas", template: "%s — Forum Peternak Unggas" },
  description:
    "Forum peternak unggas Indonesia: satu akun untuk semua topik — puyuh, ayam, bebek, dan lainnya.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1210" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Satu hitungan untuk dua tempat: lencana di bilah ponsel dan angka di
  // baris nav sidebar. Jangan biarkan keduanya membaca angka yang berbeda.
  const belumDibaca = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  const isiMenu = (
    <div className="space-y-5">
      <Suspense fallback={<div className="h-9 rounded-lg bg-sunken" />}>
        <BilahCari penuh />
      </Suspense>

      <Suspense fallback={<div className="h-44" />}>
        <NavSamping isAdmin={Boolean(user?.isAdmin && !user.isBanned)} masuk={Boolean(user && !user.isBanned)} belumDibaca={belumDibaca} ponsel />
      </Suspense>

      <div>
        <p className="px-2.5 pb-1.5 text-[12px] font-medium text-ink-faint">Tampilan</p>
        <div className="flex h-11 items-center justify-between rounded-lg px-2.5">
          <span className="text-[14px] font-medium text-ink-soft">Tema</span>
          <TombolTema ukuran="besar" />
        </div>
      </div>

      {user ? (
        <>
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Avatar username={user.username} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight text-ink-strong">
              {user.username}
            </p>
            <p className="truncate text-[12px] leading-tight text-ink-faint">
              {user.isAdmin ? "Admin" : "Anggota"}
            </p>
          </div>
          <form action={keluar}>
            <button type="submit" className="btn btn-quiet btn-sm">
              <IkonKeluar />
              Keluar
            </button>
          </form>
        </div>
        </>
      ) : (
        <div className="border-t border-border pt-4">
          <KartuTamu />
        </div>
      )}
    </div>
  );

  // Bidang terbuka: sidebar menyatu dengan tanah halaman, satu garis rambut
  // memisahkannya dari kanvas. Tidak ada bilah atas di desktop; kartu putih
  // duduk langsung di atas tanah.
  const samping = (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-border bg-surface px-3 lg:flex">
      <div className="flex h-14 shrink-0 items-center justify-between px-1">
        <Wordmark />
        <TombolTema />
      </div>

      <div className="mt-4 shrink-0">
        <Suspense fallback={<div className="h-9 rounded-lg bg-sunken" />}>
          <BilahCari penuh />
        </Suspense>
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<div className="h-[200px]" />}>
          <NavSamping isAdmin={Boolean(user?.isAdmin && !user.isBanned)} masuk={Boolean(user && !user.isBanned)} belumDibaca={belumDibaca} />
        </Suspense>
      </div>

      <div className="shrink-0 border-t border-border py-3">
        {user ? (
          <>
          <div className="flex items-center gap-2 px-1 py-1">
            <Avatar username={user.username} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-ink-strong">
                {user.username}
              </p>
              <p className="truncate text-[11.5px] leading-tight text-ink-faint">
                {user.isAdmin ? "Admin" : "Anggota"}
              </p>
            </div>
            <form action={keluar}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-wash hover:text-ink-strong"
              >
                <IkonKeluar className="h-4 w-4" />
              </button>
            </form>
          </div>
          </>
        ) : (
          <KartuTamu />
        )}
      </div>
    </aside>
  );

  // Bilah ponsel 48px: merek, satu aksi tulis, notifikasi, menu.
  // Tidak ada bilah bawah — keputusan pemilik 28 Okt.
  const bilah = (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
      <Wordmark />
      <div className="flex items-center gap-1">
        {user && <NotifikasiBadge userId={user.id} jumlah={belumDibaca} />}
        {user && <TombolTulis />}
        <MenuPonsel>{isiMenu}</MenuPonsel>
      </div>
    </header>
  );

  const kaki = (
    <footer className="mt-12 border-t border-border pt-5">
      <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>unggas.net · Forum peternak unggas Indonesia.</p>
        <a href="mailto:halo@unggas.net" className="inline-flex min-h-11 items-center transition-colors hover:text-accent-ink sm:min-h-0">
          halo@unggas.net
        </a>
      </div>
    </footer>
  );

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`h-full antialiased ${fraunces.variable} ${jakarta.variable}`}
    >
      <body className="min-h-full bg-ground font-body text-ink">
        <SkripTema />
        <MetaTema />
        <a href="#konten" className="lewati-nav">
          Langsung ke konten
        </a>

        <Bingkai samping={samping} bilah={bilah} kaki={kaki}>
          {children}
        </Bingkai>
      </body>
    </html>
  );
}
