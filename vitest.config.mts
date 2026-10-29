import { defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import path from "node:path";

// Test WAJIB memakai database terpisah (unggas_test) — jangan pernah menyentuh
// database produksi. Kredensial TIDAK disimpan di repo: isi TEST_DATABASE_URL
// di .env server (gitignored), lalu jalankan test dari folder app.
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd());
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL belum di-set. Tambahkan di .env (jangan commit).");
}

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: "test-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
