"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IkonMenu, IkonTutup } from "./Ikon";
import { Wordmark } from "./Wordmark";

/** Menu ponsel: satu lembar penuh, bukan bilah bawah. Tombol 44px membuka
 *  navigasi, pencarian, dan akun dari bilah atas 48px.
 *  Lembar ditutup saat tautan diklik, saat Escape, atau lewat tombol tutup. */
export function MenuPonsel({ children }: { children: ReactNode }) {
  const [buka, setBuka] = useState(false);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const tutupRef = useRef<HTMLButtonElement>(null);
  const pernahBuka = useRef(false);

  useEffect(() => {
    if (!buka) {
      if (pernahBuka.current) tombolRef.current?.focus();
      pernahBuka.current = false;
      return;
    }

    pernahBuka.current = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    tutupRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [buka]);

  return (
    <>
      <button
        ref={tombolRef}
        type="button"
        onClick={() => setBuka(true)}
        aria-label="Buka menu"
        aria-expanded={buka}
        aria-controls="menu-ponsel"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-wash hover:text-ink-strong"
      >
        <IkonMenu />
      </button>

      {/* Lembar dipindah ke body lewat portal: bilah atas memakai latar
          semi-transparan, dan itu menjadikannya acuan posisi elemen fixed. */}
      {buka &&
        createPortal(
          <div
            id="menu-ponsel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 overflow-y-auto bg-ground"
            onClick={(e) => {
              if ((e.target as Element).closest("a")) setBuka(false);
            }}
            onSubmit={() => setBuka(false)}
          >
          <div className="sticky top-0 flex h-12 items-center justify-between border-b border-border bg-ground px-4">
            <Wordmark />
            <button
              ref={tutupRef}
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-wash hover:text-ink-strong"
            >
              <IkonTutup />
            </button>
          </div>
            <div className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5">{children}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
