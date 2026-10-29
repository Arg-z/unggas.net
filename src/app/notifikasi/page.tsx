import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { relatif } from "@/lib/relatif";
import { Avatar } from "@/components/Avatar";
import { bukaNotifikasi, tandaiSemuaDibaca } from "@/app/actions/notifikasi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifikasi" };

export default async function NotifikasiPage() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const daftar = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      discussion: { select: { title: true } },
      actor: { select: { username: true } },
    },
  });

  const belumDibaca = daftar.filter((n) => !n.readAt).length;

  return (
    <main id="konten" tabIndex={-1} className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink-strong sm:text-[26px]">
            Notifikasi
          </h1>
          <p className="mt-1 text-[13px] text-ink-faint">
            Setiap balasan baru pada diskusimu muncul di sini.
          </p>
        </div>
        {belumDibaca > 0 && (
          <form action={tandaiSemuaDibaca} className="shrink-0">
            <button type="submit" className="btn btn-outline btn-sm">
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>

      {daftar.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <p className="mx-auto max-w-[30ch] text-[19px] font-semibold leading-snug tracking-tight text-ink-strong">
            Belum ada notifikasi.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/diskusi" className="btn btn-outline">
              Lihat semua diskusi
            </Link>
          </div>
        </div>
      ) : (
        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2.5">
            <h2 className="text-[13px] font-semibold text-ink-strong">Balasan terbaru</h2>
            <span className="tabular text-[12.5px] text-ink-faint">
              {belumDibaca > 0 ? `${belumDibaca} belum dibaca` : `${daftar.length} notifikasi`}
            </span>
          </div>

          <ul>
            {daftar.map((n) => (
              <li key={n.id} className="border-b border-rule last:border-0">
                <form action={bukaNotifikasi}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="discussionId" value={n.discussionId} />
                  <input type="hidden" name="postNumber" value={n.postNumber} />
                  <button
                    type="submit"
                    className={`-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 px-3 py-4 text-left transition-colors hover:bg-wash active:bg-wash ${
                      n.readAt ? "" : "bg-wash"
                    }`}
                  >
                    <Avatar username={n.actor.username} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-ink-faint">
                        <span className="font-medium text-ink-soft">{n.actor.username}</span>
                        <span>membalas</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular">{relatif(n.createdAt)}</span>
                      </span>
                      <span
                        className={`mt-1 line-clamp-2 block text-[15.5px] font-semibold leading-snug tracking-[-0.01em] ${
                          n.readAt ? "text-ink-soft" : "text-ink-strong"
                        }`}
                      >
                        {n.discussion.title}
                      </span>
                      <span className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-ink-faint">
                        {!n.readAt && (
                          <span className="rounded-[4px] bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-ink">
                            Baru
                          </span>
                        )}
                      </span>
                    </span>
                    {!n.readAt && (
                      <span className="mt-2 flex shrink-0 items-center">
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
                        <span className="sr-only">Belum dibaca</span>
                      </span>
                    )}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
