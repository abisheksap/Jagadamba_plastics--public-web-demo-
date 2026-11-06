import { describe, expect, it } from "vitest";
import { hashPasscode, matchesConfiguredPasscode, randomHex, timingSafeEqual, verifyPasscodeHash } from "../src/convex/authLib";

describe("authLib", () => {
  it("hashes with a fresh salt and verifies only the right passcode", async () => {
    const a = await hashPasscode("a long passphrase", 1000);
    const b = await hashPasscode("a long passphrase", 1000);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyPasscodeHash("a long passphrase", a)).toBe(true);
    expect(await verifyPasscodeHash("a long passphrasf", a)).toBe(false);
  });

  it("compares strings without being fooled by length or prefix", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("matches the configured passcode exactly", async () => {
    expect(await matchesConfiguredPasscode("secret value", "secret value")).toBe(true);
    expect(await matchesConfiguredPasscode("secret valuf", "secret value")).toBe(false);
  });

  it("produces unpredictable tokens of the requested size", () => {
    expect(randomHex(32)).toMatch(/^[0-9a-f]{64}$/);
    expect(randomHex(32)).not.toBe(randomHex(32));
  });
});
