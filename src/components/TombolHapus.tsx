"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hapusDiskusi, hapusPost } from "@/app/actions/forum";
import { IkonSampah } from "./Ikon";

/** Tombol hapus tulisan sendiri. Hard delete dengan konfirmasi; server yang
 *  memutuskan kepemilikan — tombol hanya tampil untuk pemilik/admin. */
function TombolHapus({
  label,
  konfirmasi,
  ariaLabel,
  aksi,
  selesai,
}: {
  label: string;
  konfirmasi: string;
  ariaLabel: string;
  aksi: () => Promise<{ ok: boolean; alasan?: string; hapusDiskusi?: boolean }>;
  selesai: (hasil: { ok: boolean; hapusDiskusi?: boolean }) => void;
}) {
  const router = useRouter();
  const [galat, setGalat] = useState("");
  const [pending, mulai] = useTransition();

  function klik() {
    if (!window.confirm(konfirmasi)) return;
    setGalat("");
    mulai(async () => {
      const hasil = await aksi();
      if (hasil.ok) {
        selesai(hasil);
      } else {
        setGalat(hasil.alasan ?? "Gagal menghapus.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={klik}
        disabled={pending}
        aria-label={ariaLabel}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-[12px] font-medium text-ink-faint transition-colors hover:text-danger disabled:opacity-60"
      >
        <IkonSampah className="h-3.5 w-3.5" />
        <span>{pending ? "Menghapus…" : label}</span>
      </button>
      {galat && (
        <span role="alert" className="text-[12px] text-danger">
          {galat}
        </span>
      )}
    </span>
  );
}

/** Hapus satu balasan milik sendiri. Kalau server melaporkan bahwa post
 *  pembuka ikut terhapus (post #1 = topiknya), pindah ke beranda. */
export function TombolHapusBalasan({ postId }: { postId: number }) {
  const router = useRouter();
  return (
    <TombolHapus
      label="Hapus"
      konfirmasi="Hapus balasan ini? Tindakan ini tidak bisa dibatalkan."
      ariaLabel="Hapus balasan ini"
      aksi={() => hapusPost(postId)}
      selesai={(hasil) => {
        if (hasil.hapusDiskusi) router.push("/");
        else router.refresh();
      }}
    />
  );
}

/** Hapus seluruh diskusi milik sendiri (beserta semua balasannya). Setelah
 *  terhapus diarahkan ke `tujuan` — daftar diskusi, atau dashboard bila
 *  tombolnya dipasang di halaman Postingan saya. */
export function TombolHapusDiskusi({
  discussionId,
  tujuan = "/diskusi",
}: {
  discussionId: number;
  tujuan?: string;
}) {
  const router = useRouter();
  return (
    <TombolHapus
      label="Hapus diskusi"
      konfirmasi="Hapus diskusi ini beserta semua balasannya? Tindakan ini tidak bisa dibatalkan."
      ariaLabel="Hapus diskusi ini"
      aksi={() => hapusDiskusi(discussionId)}
      selesai={() => router.push(tujuan)}
    />
  );
}
