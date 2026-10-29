import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { relatif } from "@/lib/relatif";
import { TombolHapusBalasan, TombolHapusDiskusi } from "@/components/TombolHapus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Postingan saya" };

export default async function PostinganSayaPage() {
  const user = await getSessionUser();
  if (!user || user.isBanned) redirect("/masuk");

  // Diskusi milik sendiri (termasuk yang disembunyikan admin, berbadge) dan
  // balasan non-pembuka yang tidak disembunyikan. Balasan pembuka tidak
  // dimasukkan karena isinya sudah mewakili diskusinya di daftar atas.
  const [diskusi, balasan] = await Promise.all([
    prisma.discussion.findMany({
      where: { userId: user.id },
      orderBy: { lastPostAt: "desc" },
      include: {
        _count: { select: { posts: { where: { isHidden: false } }, likes: true } },
      },
    }),
    prisma.post.findMany({
      where: { userId: user.id, number: { gt: 1 }, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { discussion: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <main id="konten" tabIndex={-1} className="w-full">
      <h1 className="font-display text-[25px] font-semibold leading-[1.28] tracking-tight text-ink-strong sm:text-[30px]">
        Postingan saya
      </h1>
      <p className="mt-2 text-[13px] text-ink-faint">
        Semua diskusi dan balasan yang pernah kamu tulis. Menghapus tulisan tidak bisa dibatalkan.
      </p>

      <section aria-labelledby="judul-diskusi-saya" className="mt-8">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2.5">
          <h2 id="judul-diskusi-saya" className="text-[13px] font-semibold text-ink-strong">
            Diskusi
          </h2>
          <span className="tabular text-[12.5px] text-ink-faint">{diskusi.length}</span>
        </div>

        {diskusi.length > 0 ? (
          <ul>
            {diskusi.map((d) => (
              <li key={d.id} className="border-b border-rule py-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/t/${d.id}`}
                      className="font-medium text-ink-strong transition-colors hover:text-accent-deep"
                    >
                      {d.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-ink-faint">
                      <span className="whitespace-nowrap">{relatif(d.lastPostAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular whitespace-nowrap">
                        {Math.max(0, d._count.posts - 1)} balasan
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular whitespace-nowrap">{d._count.likes} suka</span>
                      {d.isHidden && (
                        <span className="rounded border border-warn-line bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn-ink">
                          disembunyikan admin
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <TombolHapusDiskusi discussionId={d.id} tujuan="/postingan" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6">
            <p className="text-[14px] text-ink-soft">Kamu belum menulis diskusi apa pun.</p>
            <Link href="/baru" className="link mt-2 text-[13px]">
              Tulis diskusi pertamamu
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="judul-balasan-saya" className="mt-8">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2.5">
          <h2 id="judul-balasan-saya" className="text-[13px] font-semibold text-ink-strong">
            Balasan
          </h2>
          <span className="tabular text-[12.5px] text-ink-faint">{balasan.length}</span>
        </div>

        {balasan.length > 0 ? (
          <ul>
            {balasan.map((p) => (
              <li key={p.id} className="border-b border-rule py-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="max-w-[68ch] break-words text-[14px] leading-relaxed text-ink">
                      {p.content.length > 160 ? `${p.content.slice(0, 160).trimEnd()}…` : p.content}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-ink-faint">
                      <span className="whitespace-nowrap">{relatif(p.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>di </span>
                      <Link
                        href={`/t/${p.discussionId}`}
                        className="text-ink-soft transition-colors hover:text-accent-deep"
                      >
                        {p.discussion.title}
                      </Link>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <TombolHapusBalasan postId={p.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6">
            <p className="text-[14px] text-ink-soft">Kamu belum membalas diskusi mana pun.</p>
            <Link href="/diskusi" className="link mt-2 text-[13px]">
              Jelajahi semua diskusi
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
