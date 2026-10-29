import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { relatif } from "@/lib/relatif";
import { Avatar } from "@/components/Avatar";
import { BadgeSematkan } from "@/components/BadgeSematkan";
import {
  IkonBalasan,
  IkonBlokir,
  IkonBukaBlokir,
  IkonLepasSematkan,
  IkonMata,
  IkonMataTutup,
  IkonPenggunaBanyak,
  IkonPerisaiCentang,
  IkonSematkan,
} from "@/components/Ikon";
import { sembunyikanDiskusi, tampilkanDiskusi, setSematkan, tampilkanPost, setBan } from "../actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel admin" };

const TABS = [
  { id: "diskusi", label: "Diskusi", ikon: IkonBalasan },
  { id: "post", label: "Post tersembunyi", ikon: IkonMataTutup },
  { id: "user", label: "Pengguna", ikon: IkonPenggunaBanyak },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getSessionUser();
  if (!user || user.isBanned || !user.isAdmin) redirect("/diskusi");

  const { tab } = await searchParams;
  const aktif: Tab = tab === "post" || tab === "user" ? tab : "diskusi";

  return (
    <main id="konten" tabIndex={-1} className="w-full">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-[22px] font-semibold leading-tight tracking-tight text-ink-strong sm:text-[26px]">
          <IkonPerisaiCentang className="h-[22px] w-[22px] shrink-0" />
          Panel admin
        </h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          Moderasi diskusi, post tersembunyi, dan akun pengguna.
        </p>
      </div>

      <div className="scroll-x mt-5 flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={aktif === t.id ? "page" : undefined}
            className={`-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[13px] transition-colors sm:h-9 sm:px-3 sm:text-[13.5px] ${
              aktif === t.id
                ? "border-ink-strong font-semibold text-ink-strong"
                : "border-transparent font-medium text-ink-soft hover:text-ink-strong"
            }`}
          >
            <t.ikon
              className={`h-[15px] w-[15px] shrink-0 ${aktif === t.id ? "" : "opacity-60"}`}
            />
            {t.label}
          </Link>
        ))}
      </div>

      <section className="mt-1">
        {aktif === "diskusi" && <DaftarDiskusi />}
        {aktif === "post" && <PostTersembunyi />}
        {aktif === "user" && <DaftarPengguna akunId={user.id} />}
      </section>
    </main>
  );
}

const KEPALA = "hidden gap-x-5 px-1 pb-2 pt-4 text-[12px] font-medium text-ink-faint sm:grid";

async function DaftarDiskusi() {
  const rows = await prisma.discussion.findMany({
    orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
    include: { user: { select: { username: true } }, _count: { select: { posts: true } } },
  });

  if (rows.length === 0) {
    return (
      <p className="py-6 text-[14px] text-ink-soft">
        Belum ada diskusi.
      </p>
    );
  }

  return (
    <div>
      <div className={`${KEPALA} grid-cols-[1fr_260px]`}>
        <span>Diskusi</span>
        <span className="text-right">Tindakan</span>
      </div>
      <ul className="border-t border-rule">
        {rows.map((d) => (
          <li key={d.id} className="border-b border-rule transition-colors last:border-0 hover:bg-wash">
            <div className="grid gap-x-5 gap-y-2 px-1 py-3 sm:grid-cols-[1fr_260px] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {d.isPinned && <BadgeSematkan />}
                  {d.isHidden && (
                    <span className="rounded-[4px] border border-danger-line bg-danger-soft px-1.5 py-0.5 text-[11.5px] font-semibold leading-[1.5] text-danger">
                      Tersembunyi
                    </span>
                  )}
                </div>
                <Link
                  href={`/t/${d.id}`}
                  className="mt-1 line-clamp-2 block text-[14px] font-semibold text-ink-strong hover:text-accent-ink"
                >
                  {d.title}
                </Link>
                <p className="tabular mt-0.5 text-[12.5px] text-ink-faint">
                  {d.user.username} · {d._count.posts} post · {relatif(d.lastPostAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <form action={async () => { "use server"; await setSematkan(d.id, !d.isPinned); }}>
                  <button type="submit" className="btn btn-outline btn-sm">
                    {d.isPinned ? <IkonLepasSematkan /> : <IkonSematkan />}
                    {d.isPinned ? "Lepas sematan" : "Sematkan"}
                  </button>
                </form>
                {d.isHidden ? (
                  <form action={async () => { "use server"; await tampilkanDiskusi(d.id); }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <IkonMata className="h-3.5 w-3.5" />
                      Tampilkan
                    </button>
                  </form>
                ) : (
                  <form action={async () => { "use server"; await sembunyikanDiskusi(d.id); }}>
                    <button type="submit" className="btn btn-outline btn-sm">
                      <IkonMataTutup className="h-3.5 w-3.5" />
                      Sembunyikan
                    </button>
                  </form>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function PostTersembunyi() {
  const rows = await prisma.post.findMany({
    where: { isHidden: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } }, discussion: { select: { id: true, title: true } } },
  });

  if (rows.length === 0) {
    return (
      <p className="py-6 text-[14px] text-ink-soft">
        Tidak ada post tersembunyi.
      </p>
    );
  }

  return (
    <ul className="border-t border-rule">
      {rows.map((p) => (
        <li key={p.id} className="border-b border-rule transition-colors last:border-0 hover:bg-wash">
          <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2 px-1 py-3.5">
            <div className="min-w-0">
              <p className="tabular text-[12.5px] text-ink-faint">
                <span className="font-medium text-ink-soft">{p.user.username}</span> · #{p.number} ·{" "}
                {relatif(p.createdAt)}
              </p>
              <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink">
                {p.content}
              </p>
              <Link
                href={`/t/${p.discussion.id}#post-${p.number}`}
                className="link mt-1 text-[13px]"
              >
                di {p.discussion.title}
              </Link>
            </div>
            <form action={async () => { "use server"; await tampilkanPost(p.id); }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <IkonMata className="h-3.5 w-3.5" />
                Tampilkan
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function DaftarPengguna({ akunId }: { akunId: number }) {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      isAdmin: true,
      isBanned: true,
      _count: { select: { discussions: true, posts: true } },
    },
  });

  return (
    <div>
      <ul className="border-t border-rule">
        {rows.map((u) => (
          <li key={u.id} className="border-b border-rule transition-colors last:border-0 hover:bg-wash">
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-1 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar username={u.username} size="sm" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-ink-strong">
                    {u.username}
                    {u.isAdmin && (
                      <span className="rounded-[4px] bg-accent-soft px-1.5 py-0.5 text-[11.5px] font-semibold leading-[1.5] text-accent-ink">
                        Admin
                      </span>
                    )}
                    {u.isBanned && (
                      <span className="rounded-[4px] border border-danger-line bg-danger-soft px-1.5 py-0.5 text-[11.5px] font-semibold leading-[1.5] text-danger">
                        Diblokir
                      </span>
                    )}
                  </p>
                  <p className="tabular mt-0.5 truncate text-[12.5px] text-ink-faint">
                    {u.email} · {u._count.discussions} diskusi · {u._count.posts} post
                  </p>
                </div>
              </div>
              {u.id === akunId ? (
                <span className="text-[12.5px] text-ink-faint">akunmu sendiri</span>
              ) : (
                <form action={async () => { "use server"; await setBan(u.id, !u.isBanned); }}>
                  <button
                    type="submit"
                    className={u.isBanned ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                  >
                    {u.isBanned ? (
                      <IkonBukaBlokir className="h-3.5 w-3.5" />
                    ) : (
                      <IkonBlokir className="h-3.5 w-3.5" />
                    )}
                    {u.isBanned ? "Buka blokir" : "Blokir"}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
