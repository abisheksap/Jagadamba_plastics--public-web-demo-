// Central client-side data layer. Everything the admin panel edits and the
// public site reads lives in one namespaced localStorage record, exposed
// through a small pub/sub store so React can subscribe with useSyncExternalStore.
//
// Upgrades to a hosted backend (e.g. Convex) can swap the persistence
// functions without touching UI code.
import { buildSeedData } from "./seed";
import { IMAGE_MANIFEST } from "./imageManifest";
import type {
  ActivityEntry,
  ActivityKind,
  Enquiry,
  GalleryItem,
  HeroChipLayout,
  Product,
  ProductVariant,
  Review,
  SiteContent,
  SiteData,
} from "./types";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS } from "./types";

const STORAGE_KEY = "jagadamba-site-data-v2";
const LEGACY_KEY = "jagadamba-site-data-v1";
const MAX_ACTIVITY = 400;

let data: SiteData = load();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Ids of the pre-price-list seed catalog (21 products). */
const OLD_SEED_IDS = new Set([
  "p-green-tank", "p-black-tank", "p-hdpe-pipe", "p-hdpe-coil", "p-borewell",
  "p-pvc-bundle", "p-cpvc-bundle", "p-ug-drainage", "p-pvc-double-tee", "p-pvc-single-tee",
  "p-pvc-coupler", "p-pvc-bend-45", "p-pvc-end-cap", "p-pvc-p-trap", "p-cpvc-elbow-90",
  "p-cpvc-elbow-45", "p-cpvc-cross-tee", "p-cpvc-union", "p-cpvc-concealed-valve",
  "p-cpvc-reducing-tee", "p-cpvc-male-adapter",
]);

function load(): SiteData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteData;
      if (isValid(parsed)) {
        // migrate products written before variants existed
        parsed.products = parsed.products.map((p) => ({ ...p, variants: p.variants ?? [] }));
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        return migrateImages(parsed);
      }
    }
    // carry user edits from the v1 record forward (preserves admin work)
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as SiteData;
      if (isValid(legacy)) {
        const seed = buildSeedData();
        const untouched = legacy.products.every((p) => OLD_SEED_IDS.has(p.id));
        const products = untouched
          ? seed.products // old seed was never edited — upgrade to the full priced catalog
          : legacy.products.map((p) => ({ ...p, variants: p.variants ?? [] }));
        return migrateImages({
          products,
          gallery: legacy.gallery,
          reviews: legacy.reviews,
          enquiries: legacy.enquiries,
          settings: { ...DEFAULT_SETTINGS, ...legacy.settings },
        });
      }
    }
  } catch {
    // corrupted record — fall through to a fresh seed
  }
  return buildSeedData();
}

function isValid(d: unknown): d is SiteData {
  const v = d as SiteData;
  return (
    !!v &&
    Array.isArray(v.products) &&
    Array.isArray(v.gallery) &&
    Array.isArray(v.reviews) &&
    Array.isArray(v.enquiries) &&
    !!v.settings
  );
}

/**
 * Repair product/gallery image paths that point at files that don't exist.
 * The first catalog referenced .jpg files that were later converted to
 * transparent .png — without this fix browsers that already saved the old
 * catalog only ever show the alt text instead of the photo.
 */
function migrateImages(d: SiteData): SiteData {
  const exists = new Set<string>();
  const fileExists = (path: string) => {
    if (exists.has(path)) return true;
    const normalized = path.replace(/^\/public\//, "/").replace(/^\//, "");
    const ok = IMAGE_SET.has(normalized);
    if (ok) exists.add(path);
    return ok;
  };
  const fix = (src: string | undefined): string => {
    if (!src) return "";
    if (!src.startsWith("/images/")) return src; // uploads / external URLs are fine
    const swapExt = src.replace(/\.jpg\b/, ".png");
    if (swapExt !== src && fileExists(swapExt)) return swapExt;
    // slug fallback: keep whichever extension actually ships
    const slug = src.split("?")[0].replace(/\.[a-z0-9]+$/i, "");
    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      const candidate = `${slug}${ext}`;
      if (fileExists(candidate)) return candidate;
    }
    return src;
  };
  d.products = d.products.map((p) => ({ ...p, image: fix(p.image) }));
  d.gallery = d.gallery.map((g) => ({ ...g, image: fix(g.image) }));
  // Older preview sessions stored an empty gallery or paths that no longer
  // exist. Keep valid admin uploads, but repair a completely empty gallery
  // with the shipped editorial set so the public page is never blank.
  const galleryIsUsable = d.gallery.some((g) => g.image && (g.image.startsWith("data:") || g.image.startsWith("http") || fileExists(g.image)));
  if (!galleryIsUsable) d.gallery = buildSeedData().gallery.map((g) => ({ ...g }));
  return d;
}

/** Paths (without the leading "/") of every image shipped in /public. */
const IMAGE_SET = new Set(
  IMAGE_MANIFEST.map((p) => p.replace(/^\/public\//, "/").replace(/^\//, "")),
);

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full (large uploads) — keep the in-memory copy working
  }
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSiteData(): SiteData {
  return data;
}

// ---------- generic helpers ----------

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Append a change-log entry. Call from every mutation. */
function log(kind: ActivityKind, summary: string, detail?: string, byAdmin = true) {
  const entry: ActivityEntry = {
    id: uid("a"),
    kind,
    summary,
    detail,
    byAdmin,
    createdAt: Date.now(),
  };
  data.activity = [entry, ...(data.activity ?? [])].slice(0, MAX_ACTIVITY);
}

// ---------- products ----------

export function upsertProduct(product: Product) {
  const idx = data.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    data.products[idx] = product;
    log("product", `Product updated — ${product.name}`);
  } else {
    data.products.unshift(product);
    log("product", `Product added — ${product.name}`, product.category);
  }
  persist();
}

export function deleteProduct(id: string) {
  const p = data.products.find((x) => x.id === id);
  data.products = data.products.filter((p) => p.id !== id);
  log("product", `Product deleted — ${p?.name ?? id}`);
  persist();
}

/** Replace the whole variant list of a product in one action. */
export function setProductVariants(productId: string, variants: ProductVariant[]) {
  const p = data.products.find((x) => x.id === productId);
  if (p) {
    p.variants = variants;
    log("product", `Prices updated — ${p.name}`, `${variants.length} size/rate rows`);
    persist();
  }
}

// ---------- gallery ----------

export function upsertGalleryItem(item: GalleryItem) {
  const idx = data.gallery.findIndex((g) => g.id === item.id);
  if (idx >= 0) {
    data.gallery[idx] = item;
    log("gallery", `Gallery item updated — ${item.title}`);
  } else {
    data.gallery.push(item);
    log("gallery", `Gallery item added — ${item.title}`, item.kind);
  }
  data.gallery.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  persist();
}

export function deleteGalleryItem(id: string) {
  const g = data.gallery.find((x) => x.id === id);
  data.gallery = data.gallery.filter((g) => g.id !== id);
  log("gallery", `Gallery item deleted — ${g?.title ?? id}`);
  persist();
}

// ---------- reviews ----------

/** Public form submissions land here as "pending". */
export function submitReview(input: Pick<Review, "name" | "business" | "rating" | "quote">) {
  const review: Review = {
    ...input,
    id: uid("r"),
    status: "pending",
    createdAt: Date.now(),
  };
  data.reviews = [review, ...data.reviews];
  log("review", `Review submitted — ${input.name}`, `${input.rating}★ (awaiting approval)`, false);
  persist();
  return review.id;
}

export function setReviewStatus(id: string, status: Review["status"]) {
  const r = data.reviews.find((x) => x.id === id);
  data.reviews = data.reviews.map((r) => (r.id === id ? { ...r, status } : r));
  log("review", `Review ${status} — ${r?.name ?? id}`, r?.quote.slice(0, 80));
  persist();
}

export function deleteReview(id: string) {
  const r = data.reviews.find((x) => x.id === id);
  data.reviews = data.reviews.filter((r) => r.id !== id);
  log("review", `Review deleted — ${r?.name ?? id}`);
  persist();
}

export function approvedReviews(): Review[] {
  return data.reviews
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- enquiries ----------

export function submitEnquiry(
  input: Pick<Enquiry, "name" | "phone" | "interest" | "message">,
) {
  const enquiry: Enquiry = {
    ...input,
    id: uid("e"),
    status: "new",
    createdAt: Date.now(),
  };
  data.enquiries = [enquiry, ...data.enquiries];
  log("enquiry", `Enquiry from ${input.name}`, input.interest, false);
  persist();
  return enquiry.id;
}

export function setEnquiryStatus(id: string, status: Enquiry["status"]) {
  const e = data.enquiries.find((x) => x.id === id);
  data.enquiries = data.enquiries.map((e) => (e.id === id ? { ...e, status } : e));
  log("enquiry", `Enquiry marked ${status} — ${e?.name ?? id}`);
  persist();
}

export function deleteEnquiry(id: string) {
  const e = data.enquiries.find((x) => x.id === id);
  data.enquiries = data.enquiries.filter((e) => e.id !== id);
  log("enquiry", `Enquiry deleted — ${e?.name ?? id}`);
  persist();
}

// ---------- settings ----------

export function updateSettings(settings: SiteData["settings"]) {
  const themeChanged = settings.theme !== data.settings.theme;
  data.settings = { ...settings };
  log("settings", "Contact & settings updated", themeChanged ? `Theme → ${settings.theme}` : undefined);
  persist();
}

/** Public theme picker: intentionally does not create an admin activity entry. */
export function setPublicTheme(theme: string) {
  data.settings = { ...data.settings, theme };
  persist();
}

// ---------- site content (hero + about + leaders) ----------

export function getContent(): SiteContent {
  return { ...DEFAULT_CONTENT, ...(data.content ?? {}), leaders: data.content?.leaders ?? DEFAULT_CONTENT.leaders };
}

export function updateContent(content: SiteContent) {
  data.content = content;
  log("content", "Site content updated", "Hero / about / leadership copy");
  persist();
}

// ---------- hero group arrangement ----------

export function getHeroLayout(): HeroChipLayout | undefined {
  return data.heroLayout;
}

export function saveHeroLayout(layout: HeroChipLayout) {
  data.heroLayout = { ...layout, updatedAt: Date.now() };
  log("layout", "Home product group rearranged", `${layout.chips.length} products placed`);
  persist();
}

export function clearHeroLayout() {
  if (!data.heroLayout) return;
  data.heroLayout = undefined;
  log("layout", "Home product group reset", "Back to the default layout");
  persist();
}

// ---------- admin: backup / restore ----------

export function exportData(): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as SiteData;
    if (
      Array.isArray(parsed.products) &&
      Array.isArray(parsed.gallery) &&
      Array.isArray(parsed.reviews) &&
      Array.isArray(parsed.enquiries) &&
      parsed.settings
    ) {
      data = parsed;
      log("admin", "Backup imported", `${parsed.products.length} products restored`);
      persist();
      return true;
    }
  } catch {
    // invalid JSON
  }
  return false;
}

export function resetToSeed() {
  data = buildSeedData();
  log("admin", "Site reset to defaults");
  persist();
}
