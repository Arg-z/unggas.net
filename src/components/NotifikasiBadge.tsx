import { prisma } from "@/lib/db";
import { TombolNotifikasi } from "./TombolNotifikasi";

/** Bel notifikasi dengan jumlah belum dibaca. Angka ikut dihitung server,
 *  jadi tidak ada kedipan angka palsu saat halaman dibuka. Perilaku buka/
 *  tutup ada di TombolNotifikasi (komponen klien, perlu usePathname). */
export async function NotifikasiBadge({
  userId,
  jumlah,
}: {
  userId: number;
  jumlah?: number;
}) {
  const belumDibaca =
    jumlah ??
    (await prisma.notification.count({
      where: { userId, readAt: null },
    }));

  return <TombolNotifikasi belumDibaca={belumDibaca} />;
}
