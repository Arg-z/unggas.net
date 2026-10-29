import Link from "next/link";
import { redirect } from "next/navigation";
import { tokenMasihBerlaku } from "@/lib/emailtoken";
import { emailAktif } from "@/lib/fitur";
import { ResetForm } from "@/app/actions/EmailForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Atur ulang password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!emailAktif()) redirect("/masuk");

  const { token } = await params;

  if (!(await tokenMasihBerlaku(token, "reset"))) {
    return (
      <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
        <AuthShell
          judul="Tautan tidak berlaku"
          sub="Tautan reset password hanya berlaku 1 jam dan cuma bisa dipakai sekali."
        >
          <Link href="/lupa-password" className="btn btn-primary w-full">
            Minta tautan baru
          </Link>
          <div className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-faint">
            Ingat password?{" "}
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
        judul="Password baru"
        sub="Setelah disimpan, semua perangkat yang masih masuk akan dikeluarkan."
      >
        <ResetForm token={token} />
      </AuthShell>
    </main>
  );
}
