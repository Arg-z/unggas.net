import Link from "next/link";
import { redirect } from "next/navigation";
import { emailAktif } from "@/lib/fitur";
import { KirimUlangForm } from "@/app/actions/EmailForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Cek email" };
export const dynamic = "force-dynamic";

export default function CekEmailPage() {
  if (!emailAktif()) redirect("/masuk");
  return (
    <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
      <AuthShell
        judul="Cek email kamu"
        sub="Tautan verifikasi sudah dikirim. Buka tautan itu untuk mengaktifkan akun, lalu masuk."
      >
        <KirimUlangForm />

        <div className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-faint">
          Tidak ketemu? Cek folder spam dulu, atau kirim ulang di atas. Sudah aktif?{" "}
          <Link href="/masuk" className="link">
            Masuk
          </Link>
        </div>
      </AuthShell>
    </main>
  );
}
