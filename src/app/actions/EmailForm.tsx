"use client";

import { useActionState } from "react";
import {
  aktifkanAkun,
  kirimUlangVerifikasi,
  lupaPassword,
  resetPassword,
  type ActionResult,
} from "@/app/actions/auth";

const PESAN_NETRAL =
  "Kalau alamat itu terdaftar, kami sudah mengirim tautannya. Cek inbox dan folder spam.";

export function LupaForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(lupaPassword, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="block">
        <span className="label">Email akunmu</span>
        <input name="email" type="email" required autoComplete="email" className="input mt-2" />
      </label>
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="alert-ok">
          {PESAN_NETRAL}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? "Mengirim..." : "Kirim tautan reset"}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(resetPassword, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="label">Password baru</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input mt-2"
        />
        <span className="hint mt-1.5 block">Minimal 8 karakter.</span>
      </label>
      <label className="block">
        <span className="label">Ulangi password baru</span>
        <input
          name="ulangi"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input mt-2"
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? "Menyimpan..." : "Simpan password baru"}
      </button>
    </form>
  );
}

export function KirimUlangForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    kirimUlangVerifikasi,
    null,
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="block">
        <span className="label">Email yang kamu daftarkan</span>
        <input name="email" type="email" required autoComplete="email" className="input mt-2" />
      </label>
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="alert-ok">
          {PESAN_NETRAL}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? "Mengirim..." : "Kirim ulang email verifikasi"}
      </button>
    </form>
  );
}

/**
 * Verifikasi sengaja lewat tombol, bukan langsung saat halaman dibuka:
 * banyak penyedia email memindai tautan lebih dulu, dan itu akan menghabiskan
 * token sekali-pakai sebelum pemiliknya sempat mengklik.
 */
export function VerifikasiForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(aktifkanAkun, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Mengaktifkan..." : "Aktifkan akun saya"}
      </button>
    </form>
  );
}
