import Link from "next/link";
import { redirect } from "next/navigation";
import { tokenMasihBerlaku } from "@/lib/emailtoken";
import { emailAktif } from "@/lib/fitur";
import { VerifikasiForm } from "@/app/actions/EmailForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Verifikasi akun" };
export const dynamic = "force-dynamic";

export default async function VerifikasiPage({ params }: { params: Promise<{ token: string }> }) {
  if (!emailAktif()) redirect("/masuk");

  const { token } = await params;

  if (!(await tokenMasihBerlaku(token, "verifikasi"))) {
    return (
      <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
        <AuthShell
          judul="Tautan tidak berlaku"
          sub="Tautan verifikasi berlaku 24 jam dan cuma bisa dipakai sekali."
        >
          <Link href="/cek-email" className="btn btn-primary w-full">
            Kirim ulang verifikasi
          </Link>
          <div className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-faint">
            Akun sudah aktif?{" "}
            <Link href="/masuk" className="link">
              Masuk
            </Link>
          </div>
        </AuthShell>
      </main>
    );
  }

  return (
    <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
      <AuthShell
        judul="Aktifkan akun"
        sub="Satu klik lagi, lalu akunmu siap dipakai di forum unggas.net."
      >
        <VerifikasiForm token={token} />
      </AuthShell>
    </main>
  );
}
