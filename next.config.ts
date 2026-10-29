import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forum: semua halaman membaca sesi (cookie) — render dinamis penuh.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Jangan bocorkan versi framework di header respons.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Aset ber-hash dari Next.js: aman di-cache selamanya.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.(png|jpg|jpeg|webp|avif|svg|ico|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
};

export default nextConfig;
