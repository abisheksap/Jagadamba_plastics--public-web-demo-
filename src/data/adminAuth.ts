// Admin sign-in.
//
// Production (Convex): the passcode is checked ONLY by the server, which answers with a short-lived,
// revocable session token. The passcode is never stored in the browser, and there is no default
// passcode anywhere in this code. The token lives in sessionStorage (this tab only).
//
// Local development (no Convex, `npm run dev`): the first visit asks you to create a passcode, which is
// kept in this browser as a salted hash. A production build without a backend has no admin at all.

import { api } from "../convex/_generated/api";
import { hashPasscode, verifyPasscodeHash } from "../convex/authLib";
import type { StoredPasscode } from "../convex/authLib";
import { convexEnabled, getConvexClient } from "./convexClient";

export const MIN_PASSCODE = 12;

const TOKEN_KEY = "jagadamba-admin-token";
const EXPIRES_KEY = "jagadamba-admin-expires";
const DEV_PASSCODE_KEY = "jagadamba-dev-admin-passcode";
const AUTH_EVENT = "jagadamba-admin-auth-change";
const DEV_SESSION_MS = 12 * 60 * 60 * 1000;

export type AuthMode = "convex" | "local-dev" | "unavailable";
export type SignInResult =
  | { ok: true }
  | { ok: false; error: "bad_passcode" | "locked" | "not_configured" | "unavailable" | "network" | "weak"; message: string; retryAfterSec?: number; attemptsLeft?: number };

export function authMode(): AuthMode {
  if (convexEnabled) return "convex";
  return import.meta.env.DEV ? "local-dev" : "unavailable";
}

function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeToAdminAuth(listener: () => void): () => void {
  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}

/* ---- storage (falls back to memory where storage is blocked) ---- */

const memorySession = new Map<string, string>();
const memoryLocal = new Map<string, string>();

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
    /* memory fallback keeps this tab working */
  }
}
function sessionRemove(key: string) {
  memorySession.delete(key);
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* see sessionSet */
  }
}
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
    /* see sessionSet */
  }
}
function localRemove(key: string) {
  memoryLocal.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* see sessionSet */
  }
}

function openSession(token: string, expiresAt: number) {
  sessionSet(TOKEN_KEY, token);
  sessionSet(EXPIRES_KEY, String(expiresAt));
  announceAuthChange();
}

/** The session token sent with admin requests ("" when signed out). Not the passcode. */
export function adminCredential(): string {
  return isAdmin() ? sessionGet(TOKEN_KEY) ?? "" : "";
}

export function sessionExpiresAt(): number {
  return Number(sessionGet(EXPIRES_KEY) ?? 0);
}

/** Client-side hint only: the server decides whether a token is valid. */
export function isAdmin(): boolean {
  return Boolean(sessionGet(TOKEN_KEY)) && sessionExpiresAt() > Date.now();
}

/** Forget the session in this tab (also asks the server to revoke it). */
export function signOut() {
  const token = sessionGet(TOKEN_KEY);
  sessionRemove(TOKEN_KEY);
  sessionRemove(EXPIRES_KEY);
  if (convexEnabled && token) {
    getConvexClient()?.mutation(api.site.adminSignOut, { token }).catch(() => undefined);
  }
  announceAuthChange();
}

/* ---- local development mode ---- */

function readDevPasscode(): StoredPasscode | null {
  try {
    const raw = localGet(DEV_PASSCODE_KEY);
    return raw ? (JSON.parse(raw) as StoredPasscode) : null;
  } catch {
    return null;
  }
}

/** Local dev only: true until a passcode has been created in this browser. */
export function localNeedsSetup(): boolean {
  return authMode() === "local-dev" && !readDevPasscode();
}

export async function setupLocalPasscode(passcode: string): Promise<SignInResult> {
  if (authMode() !== "local-dev") return { ok: false, error: "unavailable", message: "Local setup is only available while developing." };
  if (passcode.length < MIN_PASSCODE) {
    return { ok: false, error: "weak", message: `Use at least ${MIN_PASSCODE} characters.` };
  }
  localSet(DEV_PASSCODE_KEY, JSON.stringify(await hashPasscode(passcode)));
  openSession("local-dev", Date.now() + DEV_SESSION_MS);
  return { ok: true };
}

/** Local dev only: forget the locally created passcode so setup starts again. */
export function resetLocalAdmin() {
  if (authMode() !== "local-dev") return;
  localRemove(DEV_PASSCODE_KEY);
  signOut();
}

/* ---- sign in / change passcode ---- */

/** The Convex client queues a request until it can connect, so without this an unreachable server would hang forever. */
function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function signIn(passcode: string): Promise<SignInResult> {
  const mode = authMode();
  if (mode === "unavailable") {
    return { ok: false, error: "unavailable", message: "Admin is not available: this site was built without a backend connection." };
  }

  if (mode === "local-dev") {
    const stored = readDevPasscode();
    if (!stored) return { ok: false, error: "bad_passcode", message: "No passcode has been created yet." };
    if (!(await verifyPasscodeHash(passcode, stored))) return { ok: false, error: "bad_passcode", message: "Incorrect passcode." };
    openSession("local-dev", Date.now() + DEV_SESSION_MS);
    return { ok: true };
  }

  const client = getConvexClient();
  if (!client) return { ok: false, error: "network", message: "Could not reach the server." };
  try {
    const res = await withTimeout(client.mutation(api.site.adminSignIn, { passcode }));
    if (res.ok) {
      openSession(res.token, res.expiresAt);
      return { ok: true };
    }
    if (res.error === "locked") {
      const minutes = Math.max(1, Math.ceil((res.retryAfterSec ?? 900) / 60));
      return { ok: false, error: "locked", retryAfterSec: res.retryAfterSec, message: `Too many wrong attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    }
    if (res.error === "not_configured") {
      return { ok: false, error: "not_configured", message: "Admin sign-in has not been set up on the server yet. Set the ADMIN_PASSCODE environment variable in your Convex dashboard, then try again." };
    }
    const left = res.attemptsLeft;
    return { ok: false, error: "bad_passcode", attemptsLeft: left, message: left != null ? `Incorrect passcode. ${left} attempt${left === 1 ? "" : "s"} left before a short lockout.` : "Incorrect passcode." };
  } catch {
    return { ok: false, error: "network", message: "Could not reach the server. Check your connection and try again." };
  }
}

export async function changePasscode(current: string, next: string): Promise<{ ok: boolean; message: string }> {
  if (next.length < MIN_PASSCODE) return { ok: false, message: `The new passcode needs at least ${MIN_PASSCODE} characters.` };
  const mode = authMode();
  if (mode === "local-dev") {
    const stored = readDevPasscode();
    if (!stored || !(await verifyPasscodeHash(current, stored))) return { ok: false, message: "The current passcode is wrong." };
    localSet(DEV_PASSCODE_KEY, JSON.stringify(await hashPasscode(next)));
    return { ok: true, message: "Passcode updated." };
  }
  const client = getConvexClient();
  const token = adminCredential();
  if (!client || !token) return { ok: false, message: "Sign in again, then retry." };
  try {
    const res = await withTimeout(client.mutation(api.site.changePasscode, { token, current, next }));
    if (res.ok) return { ok: true, message: "Passcode updated. Other devices have been signed out." };
    if (res.error === "bad_current") return { ok: false, message: "The current passcode is wrong." };
    if (res.error === "locked") return { ok: false, message: "Too many wrong attempts. Try again in a few minutes." };
    return { ok: false, message: `The new passcode needs at least ${MIN_PASSCODE} characters.` };
  } catch {
    return { ok: false, message: "Could not update the passcode. Sign in again and retry." };
  }
}
