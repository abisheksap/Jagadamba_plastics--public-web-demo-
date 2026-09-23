// Central client-side data layer. Everything the admin panel edits and the
// public site reads lives in one namespaced localStorage record, exposed
// through a small pub/sub store so React can subscribe with useSyncExternalStore.
//
// Upgrades to a hosted backend (e.g. Convex) can swap the persistence
// functions without touching UI code.
import { buildSeedData } from "./seed";
import type { Enquiry, GalleryItem, Product, ProductVariant, Review, SiteData } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const STORAGE_KEY = "jagadamba-site-data-v2";
const LEGACY_KEY = "jagadamba-site-data-v1";

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
        return parsed;
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
        return {
          products,
          gallery: legacy.gallery,
          reviews: legacy.reviews,
          enquiries: legacy.enquiries,
          settings: { ...DEFAULT_SETTINGS, ...legacy.settings },
        };
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

// ---------- products ----------

export function upsertProduct(product: Product) {
  const idx = data.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) data.products[idx] = product;
  else data.products.unshift(product);
  persist();
}

export function deleteProduct(id: string) {
  data.products = data.products.filter((p) => p.id !== id);
  persist();
}

/** Replace the whole variant list of a product in one action. */
export function setProductVariants(productId: string, variants: ProductVariant[]) {
  const p = data.products.find((x) => x.id === productId);
  if (p) {
    p.variants = variants;
    persist();
  }
}

// ---------- gallery ----------

export function upsertGalleryItem(item: GalleryItem) {
  const idx = data.gallery.findIndex((g) => g.id === item.id);
  if (idx >= 0) data.gallery[idx] = item;
  else data.gallery.unshift(item);
  persist();
}

export function deleteGalleryItem(id: string) {
  data.gallery = data.gallery.filter((g) => g.id !== id);
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
  persist();
  return review.id;
}

export function setReviewStatus(id: string, status: Review["status"]) {
  data.reviews = data.reviews.map((r) => (r.id === id ? { ...r, status } : r));
  persist();
}

export function deleteReview(id: string) {
  data.reviews = data.reviews.filter((r) => r.id !== id);
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
  persist();
  return enquiry.id;
}

export function setEnquiryStatus(id: string, status: Enquiry["status"]) {
  data.enquiries = data.enquiries.map((e) => (e.id === id ? { ...e, status } : e));
  persist();
}

export function deleteEnquiry(id: string) {
  data.enquiries = data.enquiries.filter((e) => e.id !== id);
  persist();
}

// ---------- settings ----------

export function updateSettings(settings: SiteData["settings"]) {
  data.settings = { ...settings };
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
  persist();
}
