import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { emailAktif } from "@/lib/fitur";
import { DaftarForm } from "@/app/actions/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Daftar" };

export default async function DaftarPage() {
  const user = await getSessionUser();
  if (user) redirect("/diskusi");
  const denganEmail = emailAktif();

  return (
    <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
      <AuthShell
        judul="Buat akun"
        sub={
          denganEmail
            ? "Gratis. Setelah daftar, cek email untuk mengaktifkan akun."
            : "Gratis. Pilih username dan password, akunmu langsung aktif."
        }
      >
        <DaftarForm denganEmail={denganEmail} />

        <p className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-faint">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="link">
            Masuk
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
