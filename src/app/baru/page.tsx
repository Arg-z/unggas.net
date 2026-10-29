import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { IkonPanah } from "@/components/Ikon";
import { BuatDiskusiForm } from "./BuatDiskusiForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tulis diskusi" };

export default async function BaruPage() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  return (
    <main id="konten" tabIndex={-1} className="w-full">
      <div className="min-w-0">
        <Link
          href="/diskusi"
          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink-strong sm:min-h-0"
        >
          <IkonPanah className="h-3.5 w-3.5 text-accent" />
          Semua diskusi
        </Link>

        <h1 className="mt-3 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink-strong">
          Tulis diskusi
        </h1>
        <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-ink-faint">
          Tulis pertanyaan atau pengalamanmu selengkap mungkin.
        </p>

        <div className="panel mt-5 p-4 sm:p-6">
          <BuatDiskusiForm />
        </div>
      </div>
    </main>
  );
}
