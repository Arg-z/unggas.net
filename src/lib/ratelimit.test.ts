import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, _resetBuckets } from "./ratelimit";
import { relatif } from "./relatif";

describe("rateLimit", () => {
  beforeEach(() => _resetBuckets());

  it("mengizinkan sampai max, lalu menolak dalam window", () => {
    for (let i = 0; i < 5; i++) expect(rateLimit("k1", 5, 60_000)).toBe(true);
    expect(rateLimit("k1", 5, 60_000)).toBe(false);
  });

  it("kunci berbeda tidak saling memengaruhi", () => {
    for (let i = 0; i < 5; i++) rateLimit("k2", 5, 60_000);
    expect(rateLimit("k3", 5, 60_000)).toBe(true);
  });

  it("mengizinkan lagi setelah window lewat", async () => {
    for (let i = 0; i < 3; i++) rateLimit("k4", 3, 80);
    expect(rateLimit("k4", 3, 80)).toBe(false);
    await new Promise((r) => setTimeout(r, 100));
    expect(rateLimit("k4", 3, 80)).toBe(true);
  });
});

describe("relatif", () => {
  it("format waktu lalu dalam bahasa Indonesia", () => {
    const now = Date.now();
    expect(relatif(new Date(now - 30_000), now)).toBe("baru saja");
    expect(relatif(new Date(now - 5 * 60_000), now)).toBe("5 menit lalu");
    expect(relatif(new Date(now - 3 * 3_600_000), now)).toBe("3 jam lalu");
    expect(relatif(new Date(now - 2 * 86_400_000), now)).toBe("2 hari lalu");
  });
});
