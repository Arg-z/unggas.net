import { IkonSematkan } from "./Ikon";

/** Status sematan — label kecil di tangga aksen, bukan pil besar: status
 *  menempel pada baris judul, bukan bersaing dengannya. */
export function BadgeSematkan() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[4px] border border-accent-track bg-accent-soft px-1.5 py-0.5 text-[11.5px] font-semibold leading-[1.5] text-accent-ink">
      <IkonSematkan className="h-3 w-3" />
      Disematkan
    </span>
  );
}
