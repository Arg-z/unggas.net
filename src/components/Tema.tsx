"use client";

import { useEffect } from "react";
import { IkonBulan, IkonMatahari } from "./Ikon";

/* Kunci penyimpanan pilihan tema. Tanpa nilai tersimpan, tema mengikuti
   preferensi sistem; setelah pengguna menekan tombol, pilihannya menang. */
export const KUNCI_TEMA = "unggas-tema";

const WARNA_TEMA = { gelap: "#0e1210", terang: "#ffffff" };

function warnaBilah() {
  return document.documentElement.classList.contains("dark")
    ? WARNA_TEMA.gelap
    : WARNA_TEMA.terang;
}

/* Semua perubahan DOM tema dikumpulkan di sini supaya bisa dibungkus satu
   snapshot View Transitions — bukan disebar di beberapa titik. */
function terapkanTema(gelap: boolean) {
  const akar = document.documentElement;
  akar.classList.toggle("dark", gelap);
  akar.style.colorScheme = gelap ? "dark" : "light";
  try {
    localStorage.setItem(KUNCI_TEMA, gelap ? "gelap" : "terang");
  } catch {
    /* Mode privat bisa menolak penyimpanan; tema tetap berganti sesi ini. */
  }
  const warna = warnaBilah();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", warna);
    m.removeAttribute("media");
  });
}

type TransisiTampilan = { ready: Promise<void> };
type DokumenDenganTransisi = Document & {
  startViewTransition?: (perubahan: () => void) => TransisiTampilan;
};

/* Samakan meta theme-color dengan tema aktif. Next menyisipkan ulang tag
   bermedia saat hidrasi dan navigasi, jadi pengamat ini menjaga warna bilah
   peramban tetap ikut pilihan pengguna, bukan preferensi sistem. */
export function MetaTema() {
  useEffect(() => {
    const samakan = () => {
      const warna = warnaBilah();
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        if (m.getAttribute("content") !== warna || m.hasAttribute("media")) {
          m.setAttribute("content", warna);
          m.removeAttribute("media");
        }
      });
    };
    samakan();
    const pengamat = new MutationObserver(samakan);
    pengamat.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content", "media"],
    });
    return () => pengamat.disconnect();
  }, []);

  return null;
}

/* Skrip ini berjalan sebelum isi <body> digambar, jadi tidak ada kedipan putih
   saat halaman gelap dimuat. Ditaruh di body paling atas, bukan di useEffect,
   karena efek React baru jalan setelah cat pertama. */
export const skripTema = `
(function () {
  try {
    var pilihan = localStorage.getItem("${KUNCI_TEMA}");
    var gelap = pilihan
      ? pilihan === "gelap"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var akar = document.documentElement;
    akar.classList.toggle("dark", gelap);
    akar.style.colorScheme = gelap ? "dark" : "light";
    var warna = gelap ? "${WARNA_TEMA.gelap}" : "${WARNA_TEMA.terang}";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", warna);
      m.removeAttribute("media");
    });
  } catch (e) {}
})();
`;

export function SkripTema() {
  return <script dangerouslySetInnerHTML={{ __html: skripTema }} />;
}

export function TombolTema({ ukuran = "sm" }: { ukuran?: "sm" | "besar" }) {
  function ganti(e: React.MouseEvent<HTMLButtonElement>) {
    const gelap = !document.documentElement.classList.contains("dark");
    const dok = document as DokumenDenganTransisi;
    const gerakDiizinkan = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Animasi: tema baru mengembang sebagai lingkaran dari tombol yang
    // ditekan (View Transitions). Browser tanpa dukungan — atau pengguna
    // yang meminta gerak minim — langsung mendapat tema baru tanpa animasi.
    if (gerakDiizinkan && typeof dok.startViewTransition === "function") {
      const posisi = e.currentTarget.getBoundingClientRect();
      const transisi = dok.startViewTransition(() => terapkanTema(gelap));
      transisi.ready
        .then(() => {
          const x = posisi.left + posisi.width / 2;
          const y = posisi.top + posisi.height / 2;
          const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
          );
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 450,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {
          /* Transisi dibatalkan (mis. klik ganda cepat); tema sudah terpasang. */
        });
    } else {
      terapkanTema(gelap);
    }
  }

  return (
    <button
      type="button"
      onClick={ganti}
      title="Ganti tema"
      className={`flex shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-wash hover:text-ink-strong ${
        ukuran === "besar" ? "h-11 w-11" : "h-9 w-9"
      }`}
    >
      <IkonBulan className="h-[18px] w-[18px] dark:hidden" />
      <IkonMatahari className="hidden h-[18px] w-[18px] dark:block" />
      <span className="sr-only dark:hidden">Aktifkan mode gelap</span>
      <span className="sr-only hidden dark:inline">Aktifkan mode terang</span>
    </button>
  );
}
