import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 1. Bersihkan data integration test — hanya pola nama yang dibuat test (tes + 8 hex).
async function bersih() {
  const semua = await prisma.user.findMany({ select: { id: true, username: true } });
  const tesUsers = semua.filter((u) => /^tes[0-9a-f]{8}$/.test(u.username));
  const ids = tesUsers.map((u) => u.id);
  await prisma.discussion.deleteMany({ where: { userId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`bersih: ${ids.length} user tes dihapus beserta diskusinya`);
}

// 2. Admin user — buat sekali, jangan pernah menaikkan akun yang sudah ada.
async function admin() {
  const existing = await prisma.user.findUnique({ where: { username: "arga" } });
  if (existing) {
    if (!existing.isAdmin) {
      console.error("Username arga sudah dipakai akun non-admin — hentikan seed.");
      process.exit(1);
    }
    console.log("admin sudah ada:", existing.username);
    return existing;
  }

  const pass = process.env.ADMIN_PASS ?? "";
  const data = {
    username: "arga",
    email: "arga@unggas.net",
    passwordHash: await bcrypt.hash(pass, 10),
    isAdmin: true,
  };
  const admin = await prisma.user.create({ data });
  console.log("admin siap:", admin.username);
  return admin;
}

// 3. Konten awal — pinned welcome + topik dari panduan
type Topik = { judul: string; isi: string };
const TOPIK: Topik[] = [
  { judul: "Selamat datang di Forum Peternak Unggas — perkenalkan dirimu di sini",
    isi: "Selamat datang!\n\nIni forum peternak unggas Indonesia: satu akun untuk semua diskusi.\n\nAturan singkat:\n- Sopan dan saling bantu.\n- Jual-beli nanti punya tempatnya sendiri (masih dibersiapkan).\n- Jaga data pribadi — jangan bagikan nomor HP ke publik kalau tidak yakin.\n\nMulai dari sini: perkenalkan dirimu — daerah mana, ternak apa yang kamu pelihara, dan sudah berapa lama beternak." },
  { judul: "Memilih DOQ puyuh: ciri mana yang paling menentukan menurut pengalamanmu?",
    isi: "Dari panduan unggas.net: DOQ sehat itu aktif, bersuara jernih, pupur tidak menggumpal, kaki lurus.\n\nDi lapangan, kalau harus memilih satu ciri yang paling menentukan — kalian pilih yang mana? Pernah beli DOQ bagus tampaknya tapi hasilnya kecewa?" },
  { judul: "Kandang baterai vs aviary di tanah — mana yang cocok untuk skala rumahan?",
    isi: "Kandang aviary memang lebih mirip habitat asli dan telurnya jauh lebih subur, tapi tidak semua bisa meniru tanah sebagai dasarnya.\n\nYang jalanin baterai dan yang aviary — share pengalaman: biaya, kotoran, hasil telur, sakit kaki. Kalau mulai dari nol lagi, kalian pilih yang mana?" },
  { judul: "Ventilasi kandang: kandang panas = telur turun. Kalian atur suhu & kelembapan bagaimana?",
    isi: "Puyuh betelur optimal di 18-25°C, kelembapan 40-60%. Di iklim tropis seperti kita, siang terik itu musuh utama.\n\nBagaimana kalian mengaturnya? Lokasi kandang, atap, kasa silang — apa yang terbukti di tempatmu, dan seberapa terlihat bedanya ke produksi?" },
  { judul: "Ransum campuran sendiri vs pakan jadi: hitung-hitungan nyata di lapangan",
    isi: "Banyak yang bilang campur sendiri lebih hemat, tapi banyak juga yang akhirnya balik ke pakan jadi karena repot atau salah proporsi.\n\nYang sudah mencoba keduanya: berapa selisih biayanya sebenarnya, dan apakah produksinya beda jauh?" },
  { judul: "Panen telur: jam berapa kalian panen, dan bagaimana menjaga kerabang tetap bagus?",
    isi: "Puyuh bertelur sore-malam, jadi panen pagi adalah rutinitas. Tapi kerabang tipis dan pecah tetap jadi masalah klasik.\n\nShare: jam panenmu, kandang kapan terakhir dilimeat/kalsium tambahan, dan berapa persen telur pecah di tempatmu?" },
  { judul: "Campuran pakan hemat: resep andalan kalian dan hasil produksinya?",
    isi: "Berbagi resep yuk: komposisi, harga per kg di daerahmu, dan hasil produksi (persen bertelur) dengan resep itu.\n\nTulis sejelas mungkin — banyak pemula yang belajar dari thread ini." },
  { judul: "Harga bahan pakan di daerahmu sekarang — naik lagi atau stabil?",
    isi: "Jagung, bekatul, konsentrat: harga selalu bergerak dan beda antardaerah.\n\nTulis harga terkini di daerahmu (sebutkan wilayah!) supaya kita punya gambaran nasional. Thread ini bisa jadi rujukan saat mau beli." },
  { judul: "Daya tetas turun: kapan ganti pejantan, dan bagaimana pasangkan ulang?",
    isi: "Rasio pejantan-betina, umur pejantan, dan cara pasangkan ulang tanpa perebutan — tiga hal yang sering ditanya pemula.\n\nPengalaman kalian: berapa rasio yang jalan, dan kapan tahu pejantan harus pensiun?" },
  { judul: "Pencatatan harian: catat apa saja yang ternyata penting untuk margin?",
    isi: "Banyak peternak tidak mencatat, lalu kaget saat rekap bulanan rugi.\n\nYang sudah terbiasa mencatat: formatmu seperti apa? Hanya pakan-telur-mati, atau lebih detail? Dampaknya ke keputusan usaha terasa di mana?" },
  { judul: "Harga telur puyuh sekarang di daerahmu — bertahan atau tergolek?",
    isi: "Harga telur berfluktuasi terus dan peternak kecil paling kena.\n\nTulis harga telur terbaru di daerahmu + menurutmu apa penyebabnya. Kalau mau, sertakan juga harga DOQ dan bibit." },
  { judul: "Kenapa memilih puyuh (bukan ayam)? Ceritakan awal mulamu",
    isi: "Modal kecil, siklus cepat, tapi juga ada tantangannya.\n\nApa yang bikin kamu milih puyuh di awal? Dulu mulai dari berapa ekor, dan sekarang jadi apa?" },
  { judul: "Kesalahan pemula paling mahal yang pernah kamu alami?",
    isi: "Kandang bocor saat hujan, pakan salah takaran, beli bibit murah tanpa cek — semua pernah ada yang alami.\n\nShare kesalahan paling mahalmu biar pemula lain tidak mengulanginya." },
];

async function main() {
  await bersih();
  if (!process.env.ADMIN_PASS) {
    console.error("ADMIN_PASS env kosong — hentikan sebelum membuat admin.");
    process.exit(1);
  }
  const a = await admin();

  // Pinned welcome
  const welcome = await prisma.discussion.create({
    data: {
      userId: a.id, title: TOPIK[0].judul, isPinned: true,
      posts: { create: { userId: a.id, number: 1, content: TOPIK[0].isi } },
    },
  });
  console.log("pinned welcome:", welcome.id);

  for (const t of TOPIK.slice(1)) {
    await prisma.discussion.create({
      data: {
        userId: a.id, title: t.judul,
        posts: { create: { userId: a.id, number: 1, content: t.isi } },
      },
    });
  }
  const total = await prisma.discussion.count();
  console.log(`selesai: ${total} diskusi total`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
