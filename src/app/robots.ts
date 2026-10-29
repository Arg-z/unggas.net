import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/t/"],
        disallow: ["/admin", "/baru", "/notifikasi", "/masuk", "/daftar", "/lupa-password", "/reset-password", "/cek-email", "/verifikasi", "/api/"],
      },
    ],
    sitemap: "https://unggas.net/sitemap.xml",
    host: "https://unggas.net",
  };
}
