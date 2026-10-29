// Token-bucket sederhana in-memory per kunci (user id / IP).
// Cukup untuk satu proses Next.js; bukan untuk multi-instance.
// Kunci berasal dari input pengguna, jadi jumlah dan panjangnya dibatasi serta
// entri idle dibersihkan supaya penyerang tidak bisa menggelembungkan memori.
type Bucket = { hits: number[]; windowMs: number; terakhir: number };

const buckets = new Map<string, Bucket>();

const MAKS_KUNCI = 10_000;
const MAKS_PANJANG_KUNCI = 160;
const JEDA_BERSIH_MS = 60_000;
let bersihBerikutnya = 0;

function kunciRingkas(key: string): string {
  return key.length <= MAKS_PANJANG_KUNCI ? key : key.slice(0, MAKS_PANJANG_KUNCI);
}

function jagaBatas(): void {
  // Map menjaga urutan sisip: buang kunci tertua saat melewati batas.
  while (buckets.size > MAKS_KUNCI) {
    const tertua = buckets.keys().next().value;
    if (tertua === undefined) return;
    buckets.delete(tertua);
  }
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (now >= bersihBerikutnya) {
    for (const [k, v] of buckets) {
      if (now - v.terakhir >= v.windowMs) buckets.delete(k);
    }
    bersihBerikutnya = now + JEDA_BERSIH_MS;
  }

  const kunci = kunciRingkas(key);
  const recent = (buckets.get(kunci)?.hits ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    buckets.set(kunci, { hits: recent, windowMs, terakhir: now });
    return false;
  }

  recent.push(now);
  buckets.set(kunci, { hits: recent, windowMs, terakhir: now });
  jagaBatas();
  return true;
}

export function _resetBuckets(): void {
  buckets.clear();
  bersihBerikutnya = 0;
}
