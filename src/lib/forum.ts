import { prisma } from "./db";
import type { SessionUser } from "./session";

export type Saringan = "semua" | "disematkan" | "belum-dijawab";
export type Urutan = "terbaru" | "terlama" | "dibalas";

export type DaftarDiskusi = Awaited<ReturnType<typeof listDiscussions>>;

export function parseSaringan(value?: string): Saringan {
  return value === "disematkan" || value === "belum-dijawab" ? value : "semua";
}

export function parseUrutan(value?: string): Urutan {
  return value === "terlama" || value === "dibalas" ? value : "terbaru";
}

export async function listDiscussions(opts: {
  page?: number;
  user?: SessionUser | null;
  saring?: Saringan;
  urut?: Urutan;
  q?: string;
}) {
  const halaman = Number(opts.page ?? 1);
  const page = Number.isSafeInteger(halaman) && halaman > 0 ? Math.min(halaman, 1000) : 1;
  const limit = 20;
  const saring = opts.saring ?? "semua";
  const urut = opts.urut ?? "terbaru";
  const q = (opts.q ?? "").trim().slice(0, 80);

  const where = {
    isHidden: false,
    // Pencarian hanya menyentuh judul — keputusan pemilik 29 Okt.
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(saring === "disematkan" ? { isPinned: true } : {}),
    ...(saring === "belum-dijawab"
      ? { posts: { none: { number: { gt: 1 }, isHidden: false } } }
      : {}),
  };

  // Sematan selalu di atas, apa pun urutannya — itu janji sematan.
  const orderBy =
    urut === "dibalas"
      ? [{ isPinned: "desc" as const }, { posts: { _count: "desc" as const } }]
      : urut === "terlama"
        ? [{ isPinned: "desc" as const }, { lastPostAt: "asc" as const }]
        : [{ isPinned: "desc" as const }, { lastPostAt: "desc" as const }];

  const [rows, total] = await Promise.all([
    prisma.discussion.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit + 1,
      include: {
        user: { select: { username: true } },
        _count: {
          select: {
            posts: { where: { isHidden: false } },
            likes: true,
          },
        },
        posts: { where: { number: 1, isHidden: false }, select: { content: true }, take: 1 },
      },
    }),
    prisma.discussion.count({ where }),
  ]);

  return {
    rows: rows.slice(0, limit),
    hasNext: rows.length > limit,
    page,
    total,
  };
}

export async function getThread(id: number, user?: SessionUser | null) {
  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      posts: {
        where: { isHidden: false },
        orderBy: { number: "asc" },
        include: { user: { select: { username: true } } },
      },
      _count: { select: { likes: true } },
      likes: { where: { userId: user?.id ?? -1 }, select: { id: true }, take: 1 },
    },
  });
  if (!discussion || (discussion.isHidden && !(user?.isAdmin && !user.isBanned))) return null;
  return discussion;
}

