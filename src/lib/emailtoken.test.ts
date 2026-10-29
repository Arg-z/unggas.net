import { describe, it, expect } from "vitest";
import { bentukTokenValid, hashToken, kedaluwarsa } from "./emailtoken";

describe("hashToken", () => {
  it("menghasilkan sha-256 hex 64 karakter", () => {
    expect(hashToken("abc")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deterministik dan peka perubahan sekecil apa pun", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("bentukTokenValid", () => {
  it("menerima 64 karakter hex", () => {
    expect(bentukTokenValid("a".repeat(64))).toBe(true);
    expect(bentukTokenValid("0123456789abcdef".repeat(4))).toBe(true);
  });

  it("menolak panjang atau karakter yang salah", () => {
    expect(bentukTokenValid("")).toBe(false);
    expect(bentukTokenValid("a".repeat(63))).toBe(false);
    expect(bentukTokenValid("a".repeat(65))).toBe(false);
    expect(bentukTokenValid("Z".repeat(64))).toBe(false);
    expect(bentukTokenValid("../../etc/passwd")).toBe(false);
  });
});

describe("kedaluwarsa", () => {
  it("verifikasi berlaku 24 jam, reset 1 jam", () => {
    expect(kedaluwarsa("verifikasi", 0).getTime()).toBe(24 * 60 * 60 * 1000);
    expect(kedaluwarsa("reset", 0).getTime()).toBe(60 * 60 * 1000);
  });

  it("dihitung dari waktu mulai yang diberikan", () => {
    const mulai = 1_700_000_000_000;
    expect(kedaluwarsa("reset", mulai).getTime()).toBe(mulai + 3_600_000);
  });
});
