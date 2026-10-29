import Link from "next/link";
import { prisma } from "@/lib/db";
import { relatif } from "@/lib/relatif";

export const metadata = { title: "Halaman tidak ditemukan" };
export const dynamic = "force-dynamic";

export default async function TidakKetemu() {
  // Tautan yang salah biasanya berasal dari diskusi yang sudah dihapus. Daftar
  // terbaru adalah jalan keluar yang jujur, bukan hiasan.
  const terbaru = await prisma.discussion
    .findMany({
      where: { isHidden: false },
      orderBy: { lastPostAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        lastPostAt: true,
        _count: { select: { posts: { where: { isHidden: false } } } },
      },
    })
    .catch(() => []);

  return (
    <main id="konten" tabIndex={-1} className="w-full py-4 sm:py-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
        <div>
          <p className="label-aksen">404</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight tracking-tight text-ink-strong sm:text-[34px]">
            Halaman ini tidak ada.
          </h1>
          <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-ink-soft">
            Tautannya mungkin salah ketik, atau diskusinya sudah dihapus. Daftar diskusi masih
            terbuka.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/diskusi" className="btn btn-primary">
              Ke semua diskusi
            </Link>
            <Link href="/baru" className="btn btn-outline">
              Tulis diskusi
            </Link>
          </div>
        </div>

        {terbaru.length > 0 && (
          <section
            aria-labelledby="judul-terbaru"
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            <h2 id="judul-terbaru" className="text-[12px] font-medium text-ink-faint">
              Diskusi terbaru
            </h2>
            <ul className="mt-1 divide-y divide-rule">
              {terbaru.map((d) => {
                const balasan = Math.max(0, d._count.posts - 1);
                return (
                  <li key={d.id}>
                    <Link href={`/t/${d.id}`} className="block py-2.5">
                      <span className="line-clamp-2 text-[14px] font-medium leading-snug text-ink-strong hover:text-accent-ink">
                        {d.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-faint">
                        <span className="tabular">{balasan} balasan</span>
                        <span aria-hidden="true">·</span>
                        <span>{relatif(d.lastPostAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
