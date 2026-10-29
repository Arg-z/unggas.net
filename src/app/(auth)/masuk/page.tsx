import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { emailAktif } from "@/lib/fitur";
import { MasukForm } from "@/app/actions/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Masuk" };

const PESAN: Record<string, string> = {
  verified: "Akun sudah aktif. Silakan masuk.",
  reset: "Password sudah diganti. Silakan masuk dengan password baru.",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/diskusi");

  const { verified, reset } = await searchParams;
  const pesan = verified ? PESAN.verified : reset ? PESAN.reset : null;
  const denganEmail = emailAktif();

  return (
    <main id="konten" tabIndex={-1} className="py-2 sm:py-6 md:grid md:min-h-[calc(100svh-12rem)] md:content-center">
      <AuthShell judul="Masuk" sub="Forum peternak unggas Indonesia.">
        {pesan && (
          <p role="status" className="alert-ok mb-4">
            {pesan}
          </p>
        )}
        <MasukForm denganEmail={denganEmail} />

        <div className="mt-5 flex flex-col gap-2 border-t border-rule pt-4 text-[13px] text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          {denganEmail && (
            <Link href="/lupa-password" className="link">
              Lupa password?
            </Link>
          )}
          <span className={denganEmail ? "" : "sm:ml-auto"}>
            Belum punya akun?{" "}
            <Link href="/daftar" className="link">
              Daftar
            </Link>
          </span>
        </div>
      </AuthShell>
    </main>
  );
}
