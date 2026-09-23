// Central client-side data layer. Everything the admin panel edits and the
// public site reads lives in one namespaced localStorage record, exposed
// through a small pub/sub store so React can subscribe with useSyncExternalStore.
//
// Upgrades to a hosted backend (e.g. Convex) can swap the persistence
// functions without touching UI code.
import { buildSeedData } from "./seed";
import type { Enquiry, GalleryItem, Product, Review, SiteData } from "./types";

const STORAGE_KEY = "jagadamba-site-data-v1";

let data: SiteData = load();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function load(): SiteData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteData;
      // shallow-shape guard: reseed if the structure is unrecognisable
      if (
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.gallery) &&
        Array.isArray(parsed.reviews) &&
        Array.isArray(parsed.enquiries) &&
        parsed.settings
      ) {
        return parsed;
      }
    }
  } catch {
    // corrupted record — fall through to a fresh seed
  }
  return buildSeedData();
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
