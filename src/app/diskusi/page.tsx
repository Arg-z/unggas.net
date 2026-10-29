import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  listDiscussions,
  parseSaringan,
  parseUrutan,
  type DaftarDiskusi,
} from "@/lib/forum";
import { relatif } from "@/lib/relatif";
import { IkonCari, IkonHati, IkonSematkan } from "@/components/Ikon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Semua diskusi" };

type BarisDiskusi = DaftarDiskusi["rows"][number];

const KOLOM = "grid gap-x-4 sm:grid-cols-12";
const JUDUL_KOLOM = "sm:col-span-6";
const BALASAN_KOLOM = "sm:col-span-2";
const SUKA_KOLOM = "sm:col-span-1";
const WAKTU_KOLOM = "sm:col-span-3";

export default async function Beranda({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saring?: string; urut?: string; q?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const saring = parseSaringan(params.saring);
  const urut = parseUrutan(params.urut);
  const q = (params.q ?? "").trim().slice(0, 80);
  const halaman = Number(params.page);
  const page = Number.isSafeInteger(halaman) && halaman > 0 ? Math.min(halaman, 1000) : 1;

  const [{ rows, hasNext, total }, belumDijawab] = await Promise.all([
    listDiscussions({ page, user, saring, urut, q }),
    prisma.discussion.count({
      where: {
        isHidden: false,
        isPinned: false,
        posts: { none: { number: { gt: 1 }, isHidden: false } },
      },
    }),
  ]);

  // Filter dan urutan tetap hidup di URL untuk tautan lama, tetapi tidak lagi
  // punya baris tab atau dropdown sendiri — keputusan pemilik 28 Okt.
  const dasar = new URLSearchParams();
  if (q) dasar.set("q", q);
  if (urut !== "terbaru") dasar.set("urut", urut);
  if (saring !== "semua") dasar.set("saring", saring);
  const tautan = (ubah: Record<string, string | undefined> = {}) => {
    const sp = new URLSearchParams(dasar);
    for (const [k, v] of Object.entries(ubah)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const s = sp.toString();
    return s ? `/diskusi?${s}` : "/diskusi";
  };

  const subline = (() => {
    if (q) return `${total} hasil untuk “${q}”`;
    if (saring === "belum-dijawab")
      return total === 0 ? "Tidak ada pertanyaan yang menunggu" : `${total} pertanyaan menunggu jawaban`;
    if (saring === "disematkan") return `${total} diskusi disematkan`;
    if (belumDijawab > 0) return `${belumDijawab} diskusi menunggu jawaban pertama.`;
    return "Pertanyaan, pengalaman, dan data dari peternak lain.";
  })();

  const labelDaftar = q
    ? "Hasil pencarian"
    : saring === "disematkan"
      ? "Diskusi disematkan"
      : saring === "belum-dijawab"
        ? "Menunggu jawaban"
        : urut === "terlama"
          ? "Diskusi terlama"
          : urut === "dibalas"
            ? "Paling banyak dibalas"
            : "Terbaru";

  const kosong = (() => {
    if (q) {
      return {
        judul: `Tidak ada hasil untuk “${q}”.`,
        isi: "Coba kata lain, atau kembali ke seluruh diskusi.",
        aksi: { href: tautan({ q: undefined }), label: "Hapus pencarian" },
      };
    }
    if (saring === "disematkan") {
      return {
        judul: "Belum ada diskusi yang disematkan.",
        isi: "Sematan dipakai untuk diskusi yang perlu dibaca lebih dulu: panduan, aturan forum, atau kabar penting.",
        aksi: { href: tautan({ saring: undefined }), label: "Lihat semua diskusi" },
      };
    }
    if (saring === "belum-dijawab") {
      return {
        judul: "Semua diskusi sudah dibalas.",
        isi: "Tidak ada pertanyaan yang menunggu jawaban saat ini.",
        aksi: { href: tautan({ saring: undefined }), label: "Lihat semua diskusi" },
      };
    }
    return {
      judul: "Belum ada diskusi.",
      isi: undefined,
      aksi: { href: "/baru", label: "Tulis diskusi pertama" },
    };
  })();

  // Diskusi tersemat dipindahkan ke papan pengumuman hanya di tampilan utama.
  // Di hasil pencarian, halaman kedua, dan filter lain, sematan tetap duduk di
  // daftar agar hasilnya tidak terbelah atau menyalahi filter.
  const papan = page === 1 && !q && saring === "semua" ? rows.filter((d) => d.isPinned) : [];
  const daftar = rows.filter((d) => !papan.some((p) => p.id === d.id));

  return (
    <main id="konten" tabIndex={-1} className="w-full">
      <header className="grid gap-5 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-8">
          <h1 className="font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-strong sm:text-[44px] lg:text-[48px]">
            {saring === "disematkan"
              ? "Disematkan"
              : saring === "belum-dijawab"
                ? "Belum dijawab"
                : "Semua diskusi"}
          </h1>
          <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-ink-soft">
            {subline}
          </p>
        </div>

        {q && (
          <dl className="hidden overflow-hidden rounded-[22px] bg-rule lg:col-span-4 lg:grid">
            <div className="bg-wash px-5 py-4">
              <dt className="text-[13px] text-ink-soft">Hasil pencarian</dt>
              <dd className="tabular mt-1 text-[32px] font-normal leading-none text-ink-strong">
                {total}
              </dd>
            </div>
          </dl>
        )}
      </header>

      {/* Ponsel: pencarian tinggal satu baris. Di 1024px ke atas ia pindah ke
          sidebar. Tidak ada urutan atau jumlah di sampingnya. */}
      <div className="mt-5 lg:hidden">
        <form action="/diskusi" role="search" className="relative">
          {saring !== "semua" && <input type="hidden" name="saring" value={saring} />}
          {urut !== "terbaru" && <input type="hidden" name="urut" value={urut} />}
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
            <IkonCari className="h-[15px] w-[15px]" />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari judul diskusi"
            aria-label="Cari diskusi"
            className="h-11 w-full rounded-full border border-control bg-surface pl-9 pr-4 text-[16px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 sm:text-[14px]"
          />
        </form>
      </div>

      <div className="mt-6">
        {papan.length > 0 && (
          <section aria-label="Pengumuman" className="mb-5 grid gap-3">
            {papan.map((d) => (
              <PapanDiskusi key={d.id} d={d} />
            ))}
          </section>
        )}

        {rows.length === 0 ? (
          <div className="rounded-[22px] bg-wash px-6 py-16 text-center">
            <p className="mx-auto max-w-[26ch] font-display text-[24px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink-strong sm:text-[28px]">
              {kosong.judul}
            </p>
            {kosong.isi && (
              <p className="mx-auto mt-3 max-w-[44ch] text-[14px] leading-relaxed text-ink-soft">
                {kosong.isi}
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <Link
                href={kosong.aksi.href}
                className={
                  kosong.aksi.href === "/baru"
                    ? "btn btn-primary rounded-full"
                    : "btn btn-outline rounded-full"
                }
              >
                {kosong.aksi.label}
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {daftar.length > 0 && (
              <>
                <div className="flex items-baseline justify-between gap-4 pb-2">
                  <h2 className="text-[13px] font-medium text-ink-soft">{labelDaftar}</h2>
                </div>

                <div className={`${KOLOM} hidden border-b border-border px-1 pb-2 text-[12px] text-ink-faint sm:grid`}>
                  <span className={JUDUL_KOLOM}>Diskusi</span>
                  <span className={`${BALASAN_KOLOM} text-right`}>Balasan</span>
                  <span className={`${SUKA_KOLOM} text-right`}>Suka</span>
                  <span className={`${WAKTU_KOLOM} text-right`}>Aktivitas</span>
                </div>

                <ul className="divide-y divide-rule">
                  {daftar.map((d) => (
                    <BarisDaftar key={d.id} d={d} />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {(page > 1 || hasNext) && (
          <nav aria-label="Halaman" className="mt-8 flex items-center justify-between gap-4">
            {page > 1 ? (
              <Link
                href={tautan({ page: String(page - 1) })}
                className="inline-flex h-9 items-center rounded-full border border-control px-4 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft hover:text-ink-strong"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span />
            )}
            <span className="tabular text-[12px] text-ink-faint">Halaman {page}</span>
            {hasNext ? (
              <Link
                href={tautan({ page: String(page + 1) })}
                className="inline-flex h-9 items-center rounded-full border border-control px-4 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft hover:text-ink-strong"
              >
                Berikutnya →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </main>
  );
}

function PapanDiskusi({ d }: { d: BarisDiskusi }) {
  const balasan = Math.max(0, d._count.posts - 1);
  const isi = (d.posts[0]?.content ?? "").replace(/\s+/g, " ").trim();

  return (
    <article className="rounded-[22px] bg-wash px-5 py-6 sm:px-7 sm:py-7">
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
        <IkonSematkan className="h-3.5 w-3.5" />
        Pengumuman
      </p>

      <h2 className="mt-2.5 text-[18px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink-strong sm:text-[21px] lg:text-[24px]">
        <Link href={`/t/${d.id}`} className="transition-colors hover:text-accent-ink">
          {d.title}
        </Link>
      </h2>

      {isi && (
        <p className="mt-2.5 line-clamp-2 max-w-[64ch] text-[14px] leading-[1.65] text-ink-soft sm:text-[15px]">
          {isi}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-ink-soft">
        <span className="font-medium">{d.user.username}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular whitespace-nowrap">
          {balasan} balasan · {d._count.likes} suka · {relatif(d.lastPostAt)}
        </span>
        <Link
          href={`/t/${d.id}`}
          className="ml-auto whitespace-nowrap text-[13px] font-semibold text-accent-deep hover:underline"
        >
          Baca pengumuman
        </Link>
      </div>
    </article>
  );
}

function BarisDaftar({ d }: { d: BarisDiskusi }) {
  const balasan = Math.max(0, d._count.posts - 1);
  const isi = (d.posts[0]?.content ?? "").replace(/\s+/g, " ").trim();

  return (
    <li className={`${KOLOM} group relative items-start gap-y-2 px-1 py-4 sm:items-center sm:py-5`}>
      <div className={`${JUDUL_KOLOM} min-w-0`}>
        {d.isPinned && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-[3px] text-[11.5px] font-medium text-ink-soft">
            <IkonSematkan className="h-3 w-3" />
            Disematkan
          </span>
        )}
        <h2 className="text-[16px] font-semibold leading-[1.35] tracking-[-0.01em] text-ink-strong sm:text-[17px]">
          <Link
            href={`/t/${d.id}`}
            className="line-clamp-2 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-accent-ink"
          >
            {d.title}
          </Link>
        </h2>

        {isi && (
          <p className="mt-1.5 line-clamp-2 max-w-[64ch] text-[13.5px] leading-[1.6] text-ink-soft">
            {isi}
          </p>
        )}

        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-faint sm:hidden">
          <span className="font-medium text-ink-soft">{d.user.username}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{relatif(d.lastPostAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{balasan} balasan</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{d._count.likes} suka</span>
        </p>

      </div>

      <p className={`${BALASAN_KOLOM} tabular hidden text-right text-[14px] text-ink-soft sm:block`}>
        {balasan}
      </p>

      <p className={`${SUKA_KOLOM} tabular hidden items-center justify-end gap-1 text-right text-[13px] text-ink-faint sm:flex`}>
        <IkonHati className="h-3.5 w-3.5" terisi={d._count.likes > 0} />
        {d._count.likes}
      </p>

      <p className={`${WAKTU_KOLOM} tabular hidden text-right text-[12.5px] text-ink-faint sm:block`}>
        {relatif(d.lastPostAt)}
      </p>
    </li>
  );
}
