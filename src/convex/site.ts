import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { HeroChipLayout, SiteContent } from "../data/types";
import {
  PBKDF2_ITERATIONS,
  hashPasscode,
  matchesConfiguredPasscode,
  randomHex,
  sha256Hex,
  verifyPasscodeHash,
} from "./authLib";

// The admin passcode is NOT in this repository. Set it as a Convex environment variable:
//   npx convex env set ADMIN_PASSCODE "a long, private passphrase"
declare const process: { env: Record<string, string | undefined> };

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // a sign-in lasts 12 hours
const MAX_FAILURES = 5; // wrong attempts allowed per window…
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000; // …then sign-in is locked for this long
const MIN_PASSCODE = 10;

// ---------- helpers ----------

async function getAdminDoc(ctx: any, key: string) {
  const rows = await ctx.db.query("admin").withIndex("by_key", (q: any) => q.eq("key", key)).collect();
  return rows[0] ?? null;
}

type PasscodeCheck = "ok" | "bad" | "unconfigured";

/** Checks a typed passcode against the one chosen in Settings, or else the ADMIN_PASSCODE env variable. */
async function checkPasscode(ctx: any, passcode: string): Promise<PasscodeCheck> {
  if (typeof passcode !== "string" || passcode.length === 0 || passcode.length > 200) return "bad";
  const chosen = await getAdminDoc(ctx, "passcode");
  // legacy unsalted hashes (from before sessions existed) are deliberately ignored
  if (chosen?.salt && chosen.passcodeHash) {
    const ok = await verifyPasscodeHash(passcode, {
      hash: chosen.passcodeHash,
      salt: chosen.salt,
      iterations: chosen.iterations ?? PBKDF2_ITERATIONS,
    });
    return ok ? "ok" : "bad";
  }
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured || configured.length < 8) return "unconfigured";
  return (await matchesConfiguredPasscode(passcode, configured)) ? "ok" : "bad";
}

/** Seconds left on a sign-in lockout, or 0 when sign-in is allowed. */
async function lockRemainingSec(ctx: any, now: number): Promise<number> {
  const state = await getAdminDoc(ctx, "loginState");
  return state?.lockedUntil && state.lockedUntil > now ? Math.ceil((state.lockedUntil - now) / 1000) : 0;
}

/** Counts a wrong passcode; locks sign-in after too many. Returns attempts left (0 = now locked). */
async function recordFailure(ctx: any, now: number): Promise<number> {
  const state = await getAdminDoc(ctx, "loginState");
  const inWindow = state?.windowStart && now - state.windowStart < FAILURE_WINDOW_MS;
  const failures = (inWindow ? state?.failures ?? 0 : 0) + 1;
  const windowStart = inWindow ? state!.windowStart : now;
  const locked = failures >= MAX_FAILURES;
  const next = { key: "loginState", failures: locked ? 0 : failures, windowStart, lockedUntil: locked ? now + LOCK_MS : undefined };
  if (state) await ctx.db.replace(state._id, next);
  else await ctx.db.insert("admin", next);
  if (locked) await logActivity(ctx, "admin", "Admin sign-in locked after repeated wrong passcodes", undefined, false);
  return locked ? 0 : MAX_FAILURES - failures;
}

/** True when `token` is a live admin session. Used by queries, which must not throw. */
async function isAdminToken(ctx: any, token: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length < 32 || token.length > 200) return false;
  const tokenHash = await sha256Hex(token);
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_hash", (q: any) => q.eq("tokenHash", tokenHash))
    .unique();
  return Boolean(session && session.expiresAt > Date.now());
}

async function assertAdmin(ctx: any, token: string) {
  if (!(await isAdminToken(ctx, token))) throw new Error("Unauthorized: sign in again");
}

async function setSetting(ctx: any, key: string, value: any) {
  const all = await ctx.db.query("settings").collect();
  const found = all.find((s: any) => s.key === key);
  if (found) await ctx.db.patch(found._id, { value });
  else await ctx.db.insert("settings", { key, value });
}

/** Append to the change log shown in Admin → Activity. */
async function logActivity(
  ctx: any,
  kind: string,
  summary: string,
  detail?: string,
  byAdmin = true,
) {
  await ctx.db.insert("activity", {
    kind,
    summary,
    detail,
    byAdmin,
    createdAt: Date.now(),
  });
}

// ---------- public reads ----------
// Image fields resolve to a servable URL: uploaded files via storage,
// everything else passes the stored path/URL through.

export const listProducts = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("products").collect();
    const resolved = await Promise.all(
      rows.map(async (r: any) => ({
        ...r,
        id: r._id,
        image:
          r.imageStorageId != null
            ? (await ctx.storage.getUrl(r.imageStorageId)) ?? r.image
            : r.image,
      })),
    );
    return resolved.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  },
});

export const listGallery = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("gallery").collect();
    return Promise.all(
      rows.map(async (r: any) => ({
        ...r,
        id: r._id,
        image:
          r.imageStorageId != null
            ? (await ctx.storage.getUrl(r.imageStorageId)) ?? r.image
            : r.image,
      })),
    ).then((items) => items.sort((a: any, b: any) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)));
  },
});

export const listDocuments = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("documents").collect();
    return Promise.all(
      rows.map(async (r: any) => ({
        ...r,
        id: r._id,
        image:
          r.imageStorageId != null
            ? (await ctx.storage.getUrl(r.imageStorageId)) ?? r.image
            : r.image,
      })),
    ).then((items) => items.sort((a: any, b: any) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)));
  },
});

export const getContent = query({
  handler: async (ctx): Promise<SiteContent | null> => {
    const rows = await ctx.db.query("siteContent").collect();
    const found = rows.find((r: any) => r.key === "main");
    return (found?.content as SiteContent) ?? null;
  },
});

export const getHeroLayout = query({
  handler: async (ctx): Promise<HeroChipLayout | null> => {
    const rows = await ctx.db.query("heroLayout").collect();
    const found = rows.find((r: any) => r.key === "main");
    return (found?.layout as HeroChipLayout) ?? null;
  },
});

export const listActivity = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdminToken(ctx, args.token))) return null;
    const rows = await ctx.db.query("activity").collect();
    return rows
      .map((r: any) => ({ ...r, id: r._id }))
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 200);
  },
});

/** One-time seeding of the default catalog when the database is empty. */
export const seedIfEmpty = mutation({
  args: {
    products: v.array(v.any()),
    gallery: v.array(v.any()),
    documents: v.optional(v.array(v.any())),
    reviews: v.array(v.any()),
    settings: v.array(v.any()),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("products").collect();
    if (existing.length > 0) return false;
    for (const p of args.products) {
      const { id: _id, ...rest } = p;
      await ctx.db.insert("products", rest);
    }
    for (const g of args.gallery) {
      const { id: _id, ...rest } = g;
      await ctx.db.insert("gallery", rest);
    }
    for (const d of args.documents ?? []) {
      const { id: _id, ...rest } = d;
      await ctx.db.insert("documents", rest);
    }
    if ((args.documents ?? []).length > 0) await setSetting(ctx, "documentsSeeded", true);
    for (const r of args.reviews) {
      const { id: _id, ...rest } = r;
      await ctx.db.insert("reviews", rest);
    }
    for (const s of args.settings) {
      await setSetting(ctx, s.key, s.value);
    }
    if (args.content) {
      const rows = await ctx.db.query("siteContent").collect();
      const found = rows.find((r: any) => r.key === "main");
      if (found) await ctx.db.patch(found._id, { content: args.content });
      else await ctx.db.insert("siteContent", { key: "main", content: args.content });
    }
    await logActivity(ctx, "admin", "Initial catalog seeded");
    return true;
  },
});

/** Resolve an uploaded storage id to a servable URL (admin preview after upload). */
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return (await ctx.storage.getUrl(args.storageId)) ?? "";
  },
});

export const listApprovedReviews = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("reviews").collect();
    return rows
      .filter((r: any) => r.status === "approved")
      .map((r: any) => ({ ...r, id: r._id }))
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

/** Every review including pending ones. Admin only; the public site uses listApprovedReviews. */
export const listAllReviews = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdminToken(ctx, args.token))) return null;
    const rows = await ctx.db.query("reviews").collect();
    return rows.map((r: any) => ({ ...r, id: r._id })).sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

/** Customer enquiries contain names and phone numbers: admin only. */
export const listEnquiries = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!(await isAdminToken(ctx, args.token))) return null;
    const rows = await ctx.db.query("enquiries").collect();
    return rows.map((r: any) => ({ ...r, id: r._id })).sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const getSettings = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const map: Record<string, any> = {};
    rows.forEach((r: any) => (map[r.key] = r.value));
    return {
      phone: map.phone ?? "+977-56-528831",
      phoneAlt: map.phoneAlt ?? "056-521340",
      email: map.email ?? "info@jagadambaplastic.com",
      address: map.address ?? "Bharatpur-4, Chitwan, Narayanghat, Nepal",
      facebook: map.facebook ?? "https://www.facebook.com/jagadambaplasticindustry",
      youtube: map.youtube ?? "https://www.youtube.com/@JagadambaPipeFittings",
      showPrices: map.showPrices ?? true,
      priceListDate: map.priceListDate ?? "2082/09/01",
      theme: map.theme ?? "heritage-cream",
    };
  },
});

// ---------- public writes (contact / review forms) ----------

const clip = (value: string, max: number) => value.trim().slice(0, max);

export const submitEnquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    interest: v.string(),
    message: v.string(),
    hp: v.optional(v.string()), // honeypot: real visitors never see or fill this field
  },
  handler: async (ctx, args) => {
    if (args.hp) return null; // a bot filled the hidden field: accept silently, store nothing
    const name = clip(args.name, 100);
    const phone = clip(args.phone, 30);
    if (name.length < 1 || !/^[0-9+()\-\s]{5,30}$/.test(phone)) throw new Error("Please check your name and phone number.");
    if (args.message.length > 2000) throw new Error("Message is too long (2000 characters max).");
    const now = Date.now();
    const recent = await ctx.db.query("enquiries").withIndex("by_created", (q: any) => q.gt("createdAt", now - 10 * 60 * 1000)).take(25);
    if (recent.length >= 20) throw new Error("We are receiving many enquiries right now. Please call us instead.");
    const interest = clip(args.interest, 160);
    const id = await ctx.db.insert("enquiries", {
      name,
      phone,
      interest,
      message: args.message.trim(),
      status: "new",
      createdAt: now,
    });
    await logActivity(ctx, "enquiry", `Enquiry from ${name}`, interest, false);
    return id;
  },
});

export const submitReview = mutation({
  args: {
    name: v.string(),
    business: v.optional(v.string()),
    rating: v.number(),
    quote: v.string(),
    hp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.hp) return null;
    const name = clip(args.name, 100);
    const quote = clip(args.quote, 600);
    if (name.length < 1 || quote.length < 5) throw new Error("Please add your name and a short review.");
    const rating = Math.min(5, Math.max(1, Math.round(args.rating)));
    const now = Date.now();
    const recent = await ctx.db.query("reviews").withIndex("by_created", (q: any) => q.gt("createdAt", now - 10 * 60 * 1000)).take(15);
    if (recent.length >= 10) throw new Error("Too many reviews right now. Please try again later.");
    const id = await ctx.db.insert("reviews", {
      name,
      business: args.business ? clip(args.business, 120) : undefined,
      rating,
      quote,
      status: "pending",
      createdAt: now,
    });
    await logActivity(ctx, "review", `Review submitted — ${name}`, `${rating}★`, false);
    return id;
  },
});

// ---------- admin auth ----------

/**
 * Exchanges the admin passcode for a short-lived session token. Wrong passcodes return a normal
 * result (not an error) so the failed-attempt counter is saved; after MAX_FAILURES wrong tries
 * sign-in locks for LOCK_MS. The passcode itself is never stored in the browser.
 */
export const adminSignIn = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lockedFor = await lockRemainingSec(ctx, now);
    if (lockedFor > 0) return { ok: false as const, error: "locked" as const, retryAfterSec: lockedFor };

    const check = await checkPasscode(ctx, args.passcode);
    if (check === "unconfigured") return { ok: false as const, error: "not_configured" as const };
    if (check === "bad") {
      const attemptsLeft = await recordFailure(ctx, now);
      if (attemptsLeft === 0) return { ok: false as const, error: "locked" as const, retryAfterSec: Math.ceil(LOCK_MS / 1000) };
      return { ok: false as const, error: "bad_passcode" as const, attemptsLeft };
    }

    // success: clear the counter, drop expired sessions and any legacy unsalted credential
    const state = await getAdminDoc(ctx, "loginState");
    if (state) await ctx.db.delete(state._id);
    const legacy = await getAdminDoc(ctx, "passcode");
    if (legacy && !legacy.salt) await ctx.db.delete(legacy._id);
    const expired = await ctx.db.query("adminSessions").withIndex("by_expires", (q: any) => q.lt("expiresAt", now)).take(50);
    for (const row of expired) await ctx.db.delete(row._id);

    const token = randomHex(32);
    const expiresAt = now + SESSION_TTL_MS;
    await ctx.db.insert("adminSessions", { tokenHash: await sha256Hex(token), createdAt: now, expiresAt });
    return { ok: true as const, token, expiresAt };
  },
});

export const adminSignOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.token);
    const session = await ctx.db.query("adminSessions").withIndex("by_hash", (q: any) => q.eq("tokenHash", tokenHash)).unique();
    if (session) await ctx.db.delete(session._id);
    return true;
  },
});

export const changePasscode = mutation({
  args: { token: v.string(), current: v.string(), next: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const now = Date.now();
    const lockedFor = await lockRemainingSec(ctx, now);
    if (lockedFor > 0) return { ok: false as const, error: "locked" as const, retryAfterSec: lockedFor };
    if ((await checkPasscode(ctx, args.current)) !== "ok") {
      await recordFailure(ctx, now);
      return { ok: false as const, error: "bad_current" as const };
    }
    if (args.next.length < MIN_PASSCODE || args.next.length > 200) return { ok: false as const, error: "too_short" as const };

    const stored = await hashPasscode(args.next);
    const record = { key: "passcode", passcodeHash: stored.hash, salt: stored.salt, iterations: stored.iterations, changedAt: now };
    const existing = await getAdminDoc(ctx, "passcode");
    if (existing) await ctx.db.replace(existing._id, record);
    else await ctx.db.insert("admin", record);

    // sign every other device out: only the session that made the change stays valid
    const keep = await sha256Hex(args.token);
    const sessions = await ctx.db.query("adminSessions").collect();
    for (const row of sessions) if (row.tokenHash !== keep) await ctx.db.delete(row._id);
    await logActivity(ctx, "admin", "Admin passcode changed");
    return { ok: true as const };
  },
});

// ---------- admin mutations (guarded by a session token from adminSignIn) ----------

export const upsertProduct = mutation({
  args: {
    id: v.optional(v.id("products")),
    name: v.string(),
    category: v.string(),
    tagline: v.string(),
    description: v.string(),
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    specs: v.array(v.string()),
    variants: v.array(
      v.object({
        id: v.string(),
        size: v.string(),
        spec: v.optional(v.string()),
        price: v.optional(v.number()),
        packing: v.optional(v.string()),
      }),
    ),
    priceNote: v.optional(v.string()),
    featured: v.boolean(),
    sortOrder: v.number(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const { token: _t, id, ...rest } = args;
    if (id) {
      await ctx.db.patch(id, rest);
      await logActivity(ctx, "product", `Product updated — ${args.name}`);
      return id;
    }
    const newId = await ctx.db.insert("products", rest);
    await logActivity(ctx, "product", `Product added — ${args.name}`, args.category);
    return newId;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products"), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const p = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "product", `Product deleted — ${p?.name ?? args.id}`);
  },
});

export const setProductVariants = mutation({
  args: {
    id: v.id("products"),
    variants: v.array(
      v.object({
        id: v.string(),
        size: v.string(),
        spec: v.optional(v.string()),
        price: v.optional(v.number()),
        packing: v.optional(v.string()),
      }),
    ),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const p = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { variants: args.variants });
    await logActivity(
      ctx,
      "product",
      `Prices updated — ${p?.name ?? args.id}`,
      `${args.variants.length} size/rate rows`,
    );
    return true;
  },
});

export const upsertGalleryItem = mutation({
  args: {
    id: v.optional(v.id("gallery")),
    title: v.string(),
    kind: v.union(v.literal("photo"), v.literal("video")),
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const { token: _t, id, ...rest } = args;
    if (id) {
      await ctx.db.patch(id, rest);
      await logActivity(ctx, "gallery", `Gallery item updated — ${args.title}`);
      return id;
    }
    const newId = await ctx.db.insert("gallery", rest);
    await logActivity(ctx, "gallery", `Gallery item added — ${args.title}`, args.kind);
    return newId;
  },
});

export const deleteGalleryItem = mutation({
  args: { id: v.id("gallery"), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const g = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "gallery", `Gallery item deleted — ${g?.title ?? args.id}`);
  },
});

export const upsertDocument = mutation({
  args: {
    id: v.optional(v.id("documents")),
    title: v.string(),
    kind: v.string(),
    issuer: v.optional(v.string()),
    issuedOn: v.optional(v.string()),
    validUntil: v.optional(v.string()),
    note: v.optional(v.string()),
    image: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    fileUrl: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const { token: _t, id, ...rest } = args;
    if (rest.title.trim().length === 0 || rest.title.length > 160) throw new Error("Title must be 1–160 characters");
    if (id) {
      await ctx.db.patch(id, rest);
      await logActivity(ctx, "document", `Document updated — ${args.title}`);
      return id;
    }
    const newId = await ctx.db.insert("documents", rest);
    await logActivity(ctx, "document", `Document added — ${args.title}`, args.kind);
    return newId;
  },
});

export const deleteDocument = mutation({
  args: { id: v.id("documents"), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const d = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "document", `Document deleted — ${d?.title ?? args.id}`);
  },
});

/** Seeds the starter "Our documents" entries once, for sites that already had data before this feature. */
export const seedDocumentsIfEmpty = mutation({
  args: { documents: v.array(v.any()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("documents").collect();
    if (existing.length > 0) return false;
    const settings = await ctx.db.query("settings").collect();
    if (settings.some((s: any) => s.key === "documentsSeeded")) return false; // admin removed them on purpose
    for (const d of args.documents.slice(0, 10)) {
      const { id: _id, ...rest } = d;
      await ctx.db.insert("documents", rest);
    }
    await setSetting(ctx, "documentsSeeded", true);
    return true;
  },
});

export const setReviewStatus = mutation({
  args: { id: v.id("reviews"), status: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Review no longer exists. Refresh the reviews page.");
    if (!["pending", "approved", "rejected"].includes(args.status)) {
      throw new Error("Invalid review status.");
    }
    await ctx.db.patch(args.id, {
      status: args.status as "pending" | "approved" | "rejected",
    });
    await logActivity(ctx, "review", `Review ${args.status} — ${r?.name ?? args.id}`);
    return true;
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews"), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Review has already been deleted. Refresh the reviews page.");
    await ctx.db.delete(args.id);
    await logActivity(ctx, "review", `Review deleted — ${r?.name ?? args.id}`);
    return true;
  },
});

export const setEnquiryStatus = mutation({
  args: { id: v.id("enquiries"), status: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const e = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      status: args.status as "new" | "read" | "archived",
    });
    await logActivity(ctx, "enquiry", `Enquiry marked ${args.status} — ${e?.name ?? args.id}`);
  },
});

export const deleteEnquiry = mutation({
  args: { id: v.id("enquiries"), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const e = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "enquiry", `Enquiry deleted — ${e?.name ?? args.id}`);
  },
});

export const updateSettings = mutation({
  args: {
    phone: v.string(),
    phoneAlt: v.optional(v.string()),
    email: v.string(),
    address: v.string(),
    facebook: v.string(),
    youtube: v.string(),
    showPrices: v.boolean(),
    priceListDate: v.string(),
    theme: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const { token: _t, ...rest } = args;
    const theme = rest.theme;
    delete rest.theme;
    for (const [key, value] of Object.entries(rest)) {
      await setSetting(ctx, key, value);
    }
    if (theme !== undefined) await setSetting(ctx, "theme", theme);
    await logActivity(ctx, "settings", "Contact & settings updated", theme ? `Theme → ${theme}` : undefined);
    return true;
  },
});

export const updateContent = mutation({
  args: { content: v.any(), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const rows = await ctx.db.query("siteContent").collect();
    const found = rows.find((r: any) => r.key === "main");
    if (found) await ctx.db.patch(found._id, { content: args.content });
    else await ctx.db.insert("siteContent", { key: "main", content: args.content });
    await logActivity(ctx, "content", "Site content updated", "Hero / about / leadership copy");
    return true;
  },
});

export const saveHeroLayout = mutation({
  args: { layout: v.any(), token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const rows = await ctx.db.query("heroLayout").collect();
    const found = rows.find((r: any) => r.key === "main");
    const layout = { ...args.layout, updatedAt: Date.now() };
    if (found) await ctx.db.patch(found._id, { layout });
    else await ctx.db.insert("heroLayout", { key: "main", layout });
    await logActivity(
      ctx,
      "layout",
      "Home product group rearranged",
      `${(args.layout as HeroChipLayout).chips?.length ?? 0} products placed`,
    );
    return true;
  },
});

export const clearHeroLayout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const rows = await ctx.db.query("heroLayout").collect();
    for (const row of rows) await ctx.db.delete(row._id);
    await logActivity(ctx, "layout", "Home product group reset", "Back to the default layout");
    return true;
  },
});

// image upload for admin: passcode-guarded upload URL generation
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});
