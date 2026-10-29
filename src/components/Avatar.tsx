/* Enam tint hangat yang serumpun dengan palet daun — jarak hue cukup jauh
   agar anggota bisa saling membedakan dari warna awalnya.
   Semua warna lewat token @theme (--color-av-*), tidak ada hex di komponen. */
const PALETTES = [
  "bg-av-hijau text-av-hijau-ink border-av-hijau-line",
  "bg-av-amber text-av-amber-ink border-av-amber-line",
  "bg-av-biru text-av-biru-ink border-av-biru-line",
  "bg-av-oranye text-av-oranye-ink border-av-oranye-line",
  "bg-av-teal text-av-teal-ink border-av-teal-line",
  "bg-av-rose text-av-rose-ink border-av-rose-line",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function Avatar({
  username,
  size = "sm",
}: {
  username: string;
  size?: "xs" | "sm" | "md";
}) {
  const initial = (username.trim()[0] || "U").toUpperCase();
  const palette = PALETTES[hashName(username) % PALETTES.length];
  const dims =
    size === "xs"
      ? "h-6 w-6 text-[11px]"
      : size === "md"
        ? "h-10 w-10 text-[15px]"
        : "h-7 w-7 text-xs";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full border font-semibold ${dims} ${palette}`}
    >
      {initial}
    </span>
  );
}
