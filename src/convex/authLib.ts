// Small Web Crypto helpers for admin authentication.
// Pure functions with no Convex imports, so they can be unit-tested on their own.
// Runs in Convex's default runtime and in Node 18+ (both provide globalThis.crypto).

export const PBKDF2_ITERATIONS = 120_000;
const encoder = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

/** Cryptographically random token, hex encoded (64 chars for 32 bytes). */
export function randomHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** Compares two strings without returning early on the first difference. */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export interface StoredPasscode {
  hash: string;
  salt: string;
  iterations: number;
}

async function derive(passcode: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(passcode), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex) as BufferSource, iterations },
    key,
    256,
  );
  return toHex(bits);
}

/** Salted, slow hash for a passcode that the admin chose in Settings. */
export async function hashPasscode(passcode: string, iterations = PBKDF2_ITERATIONS): Promise<StoredPasscode> {
  const salt = randomHex(16);
  return { hash: await derive(passcode, salt, iterations), salt, iterations };
}

export async function verifyPasscodeHash(passcode: string, stored: StoredPasscode): Promise<boolean> {
  return timingSafeEqual(await derive(passcode, stored.salt, stored.iterations), stored.hash);
}

/** Compares a typed passcode with the one configured in the environment, in constant time. */
export async function matchesConfiguredPasscode(typed: string, configured: string): Promise<boolean> {
  return timingSafeEqual(await sha256Hex(typed), await sha256Hex(configured));
}
