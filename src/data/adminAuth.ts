// Lightweight client-side admin gate. This is a convenience lock for a static
// site — it keeps the panel out of casual reach but is not server-grade
// security. When the data layer moves to a hosted backend, replace this with
// that backend's real auth.

const SESSION_KEY = "jagadamba-admin-session";
const PASSCODE_KEY = "jagadamba-admin-passcode";
const CRED_KEY = "jagadamba-admin-cred";
const DEFAULT_PASSCODE = "jagadamba2077";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function storedPasscodeHash(): string {
  return localStorage.getItem(PASSCODE_KEY) ?? "";
}

export async function ensurePasscodeSeeded() {
  if (!localStorage.getItem(PASSCODE_KEY)) {
    localStorage.setItem(PASSCODE_KEY, await sha256(DEFAULT_PASSCODE));
  }
}

export async function signIn(passcode: string): Promise<boolean> {
  await ensurePasscodeSeeded();
  if ((await sha256(passcode)) !== storedPasscodeHash()) return false;
  sessionStorage.setItem(SESSION_KEY, "1");
  // remember the plaintext credential for this tab so backend ops (which need
  // the passcode server-side in Convex mode) can use it
  sessionStorage.setItem(CRED_KEY, passcode);
  return true;
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(CRED_KEY);
}

export function adminCredential(): string {
  return sessionStorage.getItem(CRED_KEY) ?? "";
}

export function isAdmin(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export async function changePasscode(current: string, next: string): Promise<boolean> {
  await ensurePasscodeSeeded();
  if ((await sha256(current)) !== storedPasscodeHash()) return false;
  if (next.length < 6) return false;
  localStorage.setItem(PASSCODE_KEY, await sha256(next));
  return true;
}
