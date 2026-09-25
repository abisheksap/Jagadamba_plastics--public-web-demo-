// Lightweight client-side admin gate. This is a convenience lock for a static
// site — it keeps the panel out of casual reach but is not server-grade
// security. When Convex is configured, sign-in is also verified by the backend
// before the local session is opened.

import { api } from "../convex/_generated/api";
import { convexEnabled, getConvexClient } from "./convexClient";

const SESSION_KEY = "jagadamba-admin-session";
const PASSCODE_KEY = "jagadamba-admin-passcode";
const CRED_KEY = "jagadamba-admin-cred";
const AUTH_EVENT = "jagadamba-admin-auth-change";
const DEFAULT_PASSCODE = "jagadamba2077";

function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAdminAuth(listener: () => void): () => void {
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}

const memoryLocal = new Map<string, string>();
const memorySession = new Map<string, string>();

function localGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memoryLocal.get(key) ?? null;
  } catch {
    return memoryLocal.get(key) ?? null;
  }
}

function localSet(key: string, value: string) {
  memoryLocal.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing and embedded previews can deny storage; memory fallback
    // still lets the admin panel work for the current tab.
  }
}

function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key) ?? memorySession.get(key) ?? null;
  } catch {
    return memorySession.get(key) ?? null;
  }
}

function sessionSet(key: string, value: string) {
  memorySession.set(key, value);
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // See localSet().
  }
}

function sessionRemove(key: string) {
  memorySession.delete(key);
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // See localSet().
  }
}

/** SHA-256 fallback for non-secure static hosts where crypto.subtle is absent. */
function sha256Hex(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const hash: number[] = [];
  const k: number[] = [];
  const isComposite: Record<number, boolean> = {};
  let primeCounter = 0;
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = true;
      hash[primeCounter] = (Math.sqrt(candidate) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const bitLength = ascii.length * 8;
  ascii += "\x80";
  while (ascii.length % 64 !== 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (bitLength / maxWord) | 0;
  words[words.length] = bitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] = i < 16 ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  let result = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

async function sha256(text: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Hex(text);
}

export function storedPasscodeHash(): string {
  return localGet(PASSCODE_KEY) ?? "";
}

export async function ensurePasscodeSeeded() {
  if (!localGet(PASSCODE_KEY)) localSet(PASSCODE_KEY, await sha256(DEFAULT_PASSCODE));
}

export async function signIn(passcode: string): Promise<boolean> {
  await ensurePasscodeSeeded();
  if ((await sha256(passcode)) !== storedPasscodeHash()) return false;

  // The local hash keeps the static/local-storage mode usable. In Convex mode,
  // never grant the UI session until the server confirms the same credential.
  if (convexEnabled) {
    const client = getConvexClient();
    if (!client) return false;
    const serverAccepted = await client.mutation(api.site.adminSignIn, { passcode });
    if (!serverAccepted) return false;
  }

  sessionSet(SESSION_KEY, "1");
  // Remember the plaintext credential for this tab so backend operations can
  // use the passcode server-side in Convex mode.
  sessionSet(CRED_KEY, passcode);
  announceAuthChange();
  return true;
}

export function signOut() {
  sessionRemove(SESSION_KEY);
  sessionRemove(CRED_KEY);
  announceAuthChange();
}

export function adminCredential(): string {
  return sessionGet(CRED_KEY) ?? "";
}

export function isAdmin(): boolean {
  return sessionGet(SESSION_KEY) === "1";
}

export async function changePasscode(current: string, next: string): Promise<boolean> {
  await ensurePasscodeSeeded();
  if ((await sha256(current)) !== storedPasscodeHash()) return false;
  if (next.length < 6) return false;
  localSet(PASSCODE_KEY, await sha256(next));
  return true;
}

/** Recovery for local-mode previews after a forgotten custom passcode. */
export async function resetLocalPasscode(): Promise<void> {
  localSet(PASSCODE_KEY, await sha256(DEFAULT_PASSCODE));
  signOut();
}
