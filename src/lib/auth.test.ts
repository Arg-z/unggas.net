import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { validateSignup, validateSignupTanpaEmail, parseId } from "./validate";
import { emailAktif, emailInternal } from "./fitur";

describe("password", () => {
  it("hash dan verify cocok", async () => {
    const h = await hashPassword("T3sP3t3rnak!2026");
    expect(h).not.toContain("T3sP3t3rnak");
    expect(await verifyPassword("T3sP3t3rnak!2026", h)).toBe(true);
    expect(await verifyPassword("salah", h)).toBe(false);
  });
});

describe("validateSignup", () => {
  it("menerima pendaftaran valid", () => {
    const r = validateSignup({
      username: "peternak_ku",
      email: "peternak@unggas.net",
      password: "T3sP3t3rnak!2026",
      honeypot: "",
    });
    expect(r.ok).toBe(true);
  });

  it("menolak honeypot terisi (bot)", () => {
    const r = validateSignup({
      username: "bot",
      email: "bot@spam.com",
      password: "T3sP3t3rnak!2026",
      honeypot: "http://spam.com",
    });
    expect(r.ok).toBe(false);
  });

  it("menolak username invalid: panjang, karakter, reserved", () => {
    expect(validateSignup({ username: "ab", email: "a@b.co", password: "T3sP3t3rnak!2026", honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ username: "a".repeat(33), email: "a@b.co", password: "T3sP3t3rnak!2026", honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ username: "admin", email: "a@b.co", password: "T3sP3t3rnak!2026", honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ username: "spasi in", email: "a@b.co", password: "T3sP3t3rnak!2026", honeypot: "" }).ok).toBe(false);
  });

  it("menolak password pendek (<8)", () => {
    expect(validateSignup({ username: "arga", email: "a@b.co", password: "pendek", honeypot: "" }).ok).toBe(false);
  });

  it("menolak email invalid", () => {
    expect(validateSignup({ username: "arga", email: "bukan-email", password: "T3sP3t3rnak!2026", honeypot: "" }).ok).toBe(false);
  });
});

describe("validateSignupTanpaEmail", () => {
  it("menerima username dan password tanpa email", () => {
    const r = validateSignupTanpaEmail({
      username: "peternak_puyuh",
      password: "T3sP3t3rnak!2026",
      honeypot: "",
    });
    expect(r).toEqual({ ok: true, username: "peternak_puyuh", password: "T3sP3t3rnak!2026" });
  });

  it("tetap menolak honeypot, username reserved, dan password pendek", () => {
    const dasar = { username: "peternak", password: "T3sP3t3rnak!2026", honeypot: "" };
    expect(validateSignupTanpaEmail({ ...dasar, honeypot: "spam" }).ok).toBe(false);
    expect(validateSignupTanpaEmail({ ...dasar, username: "moderator" }).ok).toBe(false);
    expect(validateSignupTanpaEmail({ ...dasar, password: "pendek" }).ok).toBe(false);
  });
});

describe("sakelar email", () => {
  it("emailAktif hanya menyala bila EMAIL_AKTIF bernilai true", () => {
    const asli = process.env.EMAIL_AKTIF;
    try {
      delete process.env.EMAIL_AKTIF;
      expect(emailAktif()).toBe(false);
      process.env.EMAIL_AKTIF = "false";
      expect(emailAktif()).toBe(false);
      process.env.EMAIL_AKTIF = "true";
      expect(emailAktif()).toBe(true);
    } finally {
      if (asli === undefined) delete process.env.EMAIL_AKTIF;
      else process.env.EMAIL_AKTIF = asli;
    }
  });

  it("emailInternal menurunkan alamat placeholder dari username", () => {
    expect(emailInternal("Peternak_Puyuh")).toBe("peternak_puyuh@unggas.local");
  });
});

describe("parseId", () => {
  it("menerima id numerik positif", () => {
    expect(parseId("1")).toBe(1);
    expect(parseId("42")).toBe(42);
    expect(parseId("0012")).toBe(12);
  });

  it("menolak segmen URL yang bukan id", () => {
    for (const raw of ["abc", "1abc", "1.5", "-1", "0", " ", "1e3", "99999999999999999999"]) {
      expect(parseId(raw), raw).toBeNull();
    }
  });
});
