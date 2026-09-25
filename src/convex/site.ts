import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { HeroChipLayout, SiteContent } from "../data/types";

// ---------- pure-TS SHA-256 (works in Convex's isolated runtime) ----------

function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

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
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

// ---------- helpers ----------

async function getPasscodeHash(ctx: any): Promise<string> {
  const all = await ctx.db.query("admin").collect();
  const found = all.find((a: any) => a.key === "passcode");
  if (!found) {
    const hash = sha256Hex("jagadamba2077");
    await ctx.db.insert("admin", { key: "passcode", passcodeHash: hash });
    return hash;
  }
  return found.passcodeHash;
}

async function assertAdmin(ctx: any, passcode: string) {
  const hash = sha256Hex(passcode);
  const stored = await getPasscodeHash(ctx);
  if (hash !== stored) throw new Error("Unauthorized: bad admin passcode");
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
  handler: async (ctx) => {
    const rows = await ctx.db.query("activity").collect();
    return rows.sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 200);
  },
});

/** One-time seeding of the default catalog when the database is empty. */
export const seedIfEmpty = mutation({
  args: {
    products: v.array(v.any()),
    gallery: v.array(v.any()),
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
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const listAllReviews = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("reviews").collect();
    return rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const listEnquiries = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("enquiries").collect();
    return rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
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

export const submitEnquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    interest: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("enquiries", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });
    await logActivity(ctx, "enquiry", `Enquiry from ${args.name}`, args.interest, false);
    return id;
  },
});

export const submitReview = mutation({
  args: {
    name: v.string(),
    business: v.optional(v.string()),
    rating: v.number(),
    quote: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("reviews", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    await logActivity(ctx, "review", `Review submitted — ${args.name}`, `${args.rating}★`, false);
    return id;
  },
});

// ---------- admin auth ----------

export const adminSignIn = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    const hash = sha256Hex(args.passcode);
    const stored = await getPasscodeHash(ctx);
    return hash === stored;
  },
});

export const changePasscode = mutation({
  args: { current: v.string(), next: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.current);
    if (args.next.length < 6) throw new Error("New passcode too short (min 6)");
    const hash = sha256Hex(args.next);
    const all = await ctx.db.query("admin").collect();
    const found = all.find((a: any) => a.key === "passcode");
    if (found) await ctx.db.patch(found._id, { passcodeHash: hash });
    else await ctx.db.insert("admin", { key: "passcode", passcodeHash: hash });
    await logActivity(ctx, "admin", "Admin passcode changed");
    return true;
  },
});

// ---------- admin mutations (passcode-guarded) ----------

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
    passcode: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const { passcode: _p, id, ...rest } = args;
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
  args: { id: v.id("products"), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
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
    passcode: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
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
    passcode: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const { passcode: _p, id, ...rest } = args;
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
  args: { id: v.id("gallery"), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const g = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "gallery", `Gallery item deleted — ${g?.title ?? args.id}`);
  },
});

export const setReviewStatus = mutation({
  args: { id: v.id("reviews"), status: v.string(), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const r = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      status: args.status as "pending" | "approved" | "rejected",
    });
    await logActivity(ctx, "review", `Review ${args.status} — ${r?.name ?? args.id}`);
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews"), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const r = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logActivity(ctx, "review", `Review deleted — ${r?.name ?? args.id}`);
  },
});

export const setEnquiryStatus = mutation({
  args: { id: v.id("enquiries"), status: v.string(), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const e = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      status: args.status as "new" | "read" | "archived",
    });
    await logActivity(ctx, "enquiry", `Enquiry marked ${args.status} — ${e?.name ?? args.id}`);
  },
});

export const deleteEnquiry = mutation({
  args: { id: v.id("enquiries"), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
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
    passcode: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const { passcode: _p, ...rest } = args;
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
  args: { content: v.any(), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const rows = await ctx.db.query("siteContent").collect();
    const found = rows.find((r: any) => r.key === "main");
    if (found) await ctx.db.patch(found._id, { content: args.content });
    else await ctx.db.insert("siteContent", { key: "main", content: args.content });
    await logActivity(ctx, "content", "Site content updated", "Hero / about / leadership copy");
    return true;
  },
});

export const saveHeroLayout = mutation({
  args: { layout: v.any(), passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
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
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    const rows = await ctx.db.query("heroLayout").collect();
    for (const row of rows) await ctx.db.delete(row._id);
    await logActivity(ctx, "layout", "Home product group reset", "Back to the default layout");
    return true;
  },
});

// image upload for admin: passcode-guarded upload URL generation
export const generateUploadUrl = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.passcode);
    return await ctx.storage.generateUploadUrl();
  },
});
