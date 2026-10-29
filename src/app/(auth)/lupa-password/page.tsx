import Link from "next/link";
import { emailAktif } from "@/lib/fitur";
import { LupaForm } from "@/app/actions/EmailForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Lupa password" };
export const dynamic = "force-dynamic";

export default function LupaPasswordPage() {
  if (!emailAktif()) {
    return (
      <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
        <AuthShell judul="Lupa password" sub="Reset lewat email sedang dimatikan sementara.">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            Kamu tetap bisa masuk dengan username dan password seperti biasa. Kalau password lupa,{" "}
            <a href="mailto:halo@unggas.net" className="link">
              hubungi admin
            </a>{" "}
            untuk mengatur ulang.
          </p>
          <Link href="/masuk" className="btn btn-primary mt-5 w-full">
            Kembali ke halaman masuk
          </Link>
        </AuthShell>
      </main>
    );
  }

  return (
    <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
      <AuthShell
        judul="Lupa password"
        sub="Masukkan email akunmu. Kami kirim tautan untuk membuat password baru. Tautannya berlaku satu jam."
      >
        <LupaForm />
        <p className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-faint">
          Ingat password?{" "}
          <Link href="/masuk" className="link">
            Masuk
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
