/**
 * Admin authentication and data-exposure tests. These run the real Convex functions in convex-test.
 * Run with:  npm test
 */
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../src/convex/_generated/api";
import schema from "../../src/convex/schema";
import { sha256Hex } from "../../src/convex/authLib";

const modules = import.meta.glob("../../src/convex/**/*.*s");
const PASSCODE = "correct horse battery staple";

const setEnv = (value: string | undefined) => {
  const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
  if (value === undefined) delete env.ADMIN_PASSCODE;
  else env.ADMIN_PASSCODE = value;
};

async function signIn(t: ReturnType<typeof convexTest>, passcode = PASSCODE) {
  return t.mutation(api.site.adminSignIn, { passcode });
}

async function token(t: ReturnType<typeof convexTest>): Promise<string> {
  const res = await signIn(t);
  if (!res.ok) throw new Error("expected sign-in to succeed");
  return res.token;
}

beforeEach(() => setEnv(PASSCODE));
afterEach(() => {
  setEnv(undefined);
  vi.useRealTimers();
});

describe("sign-in", () => {
  it("refuses everyone when no passcode has been configured (fails closed)", async () => {
    setEnv(undefined);
    const t = convexTest(schema, modules);
    expect(await signIn(t, "anything at all")).toEqual({ ok: false, error: "not_configured" });
  });

  it("refuses a passcode that is too short to be a real configuration", async () => {
    setEnv("short");
    const t = convexTest(schema, modules);
    expect(await signIn(t, "short")).toEqual({ ok: false, error: "not_configured" });
  });

  it("does not accept the old default passcode", async () => {
    const t = convexTest(schema, modules);
    const res = await signIn(t, "jagadamba2077");
    expect(res.ok).toBe(false);
  });

  it("returns a random 64-character session token for the right passcode", async () => {
    const t = convexTest(schema, modules);
    const a = await signIn(t);
    const b = await signIn(t);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.token).toMatch(/^[0-9a-f]{64}$/);
      expect(a.token).not.toBe(b.token);
      expect(a.expiresAt).toBeGreaterThan(Date.now());
    }
  });

  it("stores only a hash of the session token, never the token", async () => {
    const t = convexTest(schema, modules);
    const res = await signIn(t);
    if (!res.ok) throw new Error("sign-in failed");
    const rows = await t.run(async (ctx) => ctx.db.query("adminSessions").collect());
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(res.token);
    expect(rows[0].tokenHash).toBe(await sha256Hex(res.token));
  });

  it("counts wrong attempts, then locks sign-in, even for the right passcode", async () => {
    const t = convexTest(schema, modules);
    const first = await signIn(t, "wrong-1");
    expect(first).toMatchObject({ ok: false, error: "bad_passcode", attemptsLeft: 4 });
    await signIn(t, "wrong-2");
    await signIn(t, "wrong-3");
    await signIn(t, "wrong-4");
    expect(await signIn(t, "wrong-5")).toMatchObject({ ok: false, error: "locked" });
    // locked: the correct passcode is refused too
    expect(await signIn(t)).toMatchObject({ ok: false, error: "locked" });
  });

  it("lets the admin back in once the lockout has passed", async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    for (let i = 0; i < 5; i++) await signIn(t, `wrong-${i}`);
    expect(await signIn(t)).toMatchObject({ error: "locked" });
    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    expect((await signIn(t)).ok).toBe(true);
  });

  it("ignores a legacy unsalted passcode hash and removes it on sign-in", async () => {
    const t = convexTest(schema, modules);
    const legacy = await sha256Hex("jagadamba2077");
    await t.run(async (ctx) => {
      await ctx.db.insert("admin", { key: "passcode", passcodeHash: legacy });
    });
    expect((await signIn(t, "jagadamba2077")).ok).toBe(false); // the old default no longer works
    expect((await signIn(t)).ok).toBe(true); // the environment passcode does
    const left = await t.run(async (ctx) => ctx.db.query("admin").collect());
    expect(left.some((r) => r.key === "passcode")).toBe(false);
  });
});

describe("sessions", () => {
  it("lets a signed-in admin read enquiries and write", async () => {
    const t = convexTest(schema, modules);
    const tk = await token(t);
    expect(await t.query(api.site.listEnquiries, { token: tk })).toEqual([]);
    await t.mutation(api.site.upsertDocument, { token: tk, title: "NS certificate", kind: "certificate", image: "" });
    expect(await t.query(api.site.listDocuments, {})).toHaveLength(1);
  });

  it("rejects missing, malformed and unknown tokens", async () => {
    const t = convexTest(schema, modules);
    await token(t);
    for (const bad of ["", "abc", "x".repeat(64), "0".repeat(64)]) {
      expect(await t.query(api.site.listEnquiries, { token: bad })).toBeNull();
      await expect(t.mutation(api.site.upsertDocument, { token: bad, title: "x", kind: "other", image: "" })).rejects.toThrow(/Unauthorized/);
    }
  });

  it("expires a session after 12 hours", async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    const tk = await token(t);
    expect(await t.query(api.site.listEnquiries, { token: tk })).not.toBeNull();
    vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000);
    expect(await t.query(api.site.listEnquiries, { token: tk })).toBeNull();
  });

  it("sign-out revokes the token immediately", async () => {
    const t = convexTest(schema, modules);
    const tk = await token(t);
    await t.mutation(api.site.adminSignOut, { token: tk });
    expect(await t.query(api.site.listEnquiries, { token: tk })).toBeNull();
  });
});

describe("what visitors can and cannot read", () => {
  it("enquiries, pending reviews and the activity log are admin-only", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.site.submitEnquiry, { name: "Sita", phone: "9800000000", interest: "PVC Pipe", message: "Price?" });
    await t.mutation(api.site.submitReview, { name: "Ram", rating: 5, quote: "Great quality" });
    expect(await t.query(api.site.listEnquiries, { token: "" })).toBeNull();
    expect(await t.query(api.site.listAllReviews, { token: "" })).toBeNull();
    expect(await t.query(api.site.listActivity, { token: "" })).toBeNull();
    expect(await t.query(api.site.listApprovedReviews, {})).toEqual([]); // pending is not public
    const tk = await token(t);
    expect(await t.query(api.site.listEnquiries, { token: tk })).toHaveLength(1);
    expect(await t.query(api.site.listAllReviews, { token: tk })).toHaveLength(1);
  });
});

describe("changing the passcode", () => {
  it("needs the current passcode and a long enough new one", async () => {
    const t = convexTest(schema, modules);
    const tk = await token(t);
    expect(await t.mutation(api.site.changePasscode, { token: tk, current: "nope", next: "a-new-long-passcode" })).toMatchObject({ ok: false, error: "bad_current" });
    expect(await t.mutation(api.site.changePasscode, { token: tk, current: PASSCODE, next: "short" })).toMatchObject({ ok: false, error: "too_short" });
  });

  it("switches to the new passcode, stores it salted, and signs out other devices", async () => {
    const t = convexTest(schema, modules);
    const mine = await token(t);
    const other = await token(t);
    const next = "a-brand-new-passcode-42";
    expect(await t.mutation(api.site.changePasscode, { token: mine, current: PASSCODE, next })).toEqual({ ok: true });

    expect((await signIn(t, PASSCODE)).ok).toBe(false); // old one is dead, env var no longer used
    expect((await signIn(t, next)).ok).toBe(true);
    expect(await t.query(api.site.listEnquiries, { token: mine })).not.toBeNull(); // this device stays signed in
    expect(await t.query(api.site.listEnquiries, { token: other })).toBeNull(); // others are signed out

    const doc = (await t.run(async (ctx) => ctx.db.query("admin").collect())).find((r) => r.key === "passcode");
    expect(doc?.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(doc)).not.toContain(next);
  });
});

describe("public forms", () => {
  it("silently drops submissions that fill the hidden honeypot field", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.site.submitEnquiry, { name: "Bot", phone: "9800000000", interest: "x", message: "spam", hp: "http://spam.example" });
    const tk = await token(t);
    expect(await t.query(api.site.listEnquiries, { token: tk })).toHaveLength(0);
  });

  it("validates input and limits how fast enquiries can arrive", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.site.submitEnquiry, { name: "A", phone: "abc", interest: "x", message: "m" })).rejects.toThrow(/name and phone/);
    await expect(t.mutation(api.site.submitEnquiry, { name: "A", phone: "9800000000", interest: "x", message: "m".repeat(2001) })).rejects.toThrow(/too long/);
    for (let i = 0; i < 20; i++) await t.mutation(api.site.submitEnquiry, { name: `N${i}`, phone: "9800000000", interest: "x", message: "hello" });
    await expect(t.mutation(api.site.submitEnquiry, { name: "N21", phone: "9800000000", interest: "x", message: "hello" })).rejects.toThrow(/many enquiries/);
  });
});
