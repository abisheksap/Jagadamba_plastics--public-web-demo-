// Unified backend helpers used by pages and the admin panel.
// When VITE_CONVEX_URL is configured, writes go to Convex (shared across
// devices and staff). Otherwise everything falls back to the localStorage
// store so the site keeps working standalone.
import { convexEnabled, getConvexClient } from "./convexClient";
import * as local from "./store";
import type {
  ActivityEntry,
  Enquiry,
  HeroChipLayout,
  ProductVariant,
  Review,
  SiteContent,
  SiteData,
} from "./types";
import { api } from "../convex/_generated/api";

export const backendMode: "convex" | "local" = convexEnabled ? "convex" : "local";

/** Shared read helper: reviews that are cleared to appear on the public site. */
export function pickApproved(reviews: Review[]): Review[] {
  return reviews
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Change the admin passcode in whichever backend is active.
 * Returns false when the current passcode is wrong or the new one is too short.
 */
export async function changePasscodeAnywhere(current: string, next: string): Promise<boolean> {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      try {
        await client.mutation(api.site.changePasscode, { current, next });
        return true;
      } catch {
        return false;
      }
    }
  }
  const { changePasscode } = await import("./adminAuth");
  return changePasscode(current, next);
}

// ---------- public form submissions ----------

export async function submitEnquiry(
  input: Pick<Enquiry, "name" | "phone" | "interest" | "message">,
) {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      await client.mutation(api.site.submitEnquiry, input);
      return;
    }
  }
  local.submitEnquiry(input);
}

export async function submitReview(
  input: Pick<Review, "name" | "business" | "rating" | "quote">,
) {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      await client.mutation(api.site.submitReview, input);
      return;
    }
  }
  local.submitReview(input);
}

// ---------- admin operations (passcode required in convex mode) ----------

export interface AdminOps {
  upsertProduct(p: any): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  setProductVariants(productId: string, variants: ProductVariant[]): Promise<void>;
  upsertGalleryItem(g: any): Promise<void>;
  deleteGalleryItem(id: string): Promise<void>;
  setReviewStatus(id: string, status: Review["status"]): Promise<void>;
  deleteReview(id: string): Promise<void>;
  setEnquiryStatus(id: string, status: Enquiry["status"]): Promise<void>;
  deleteEnquiry(id: string): Promise<void>;
  updateSettings(s: SiteData["settings"]): Promise<void>;
  updateContent(c: SiteContent): Promise<void>;
  saveHeroLayout(l: HeroChipLayout): Promise<void>;
  clearHeroLayout(): Promise<void>;
  changePasscode(current: string, next: string): Promise<boolean>;
  uploadImage(file: File): Promise<{ url: string; storageId?: string }>;
}

/** Local (localStorage) implementation of the admin ops. */
export const localAdminOps: AdminOps = {
  async upsertProduct(p) {
    local.upsertProduct(p);
  },
  async deleteProduct(id) {
    local.deleteProduct(id);
  },
  async setProductVariants(productId, variants) {
    local.setProductVariants(productId, variants);
  },
  async upsertGalleryItem(g) {
    local.upsertGalleryItem(g);
  },
  async deleteGalleryItem(id) {
    local.deleteGalleryItem(id);
  },
  async setReviewStatus(id, status) {
    local.setReviewStatus(id, status);
  },
  async deleteReview(id) {
    local.deleteReview(id);
  },
  async setEnquiryStatus(id, status) {
    local.setEnquiryStatus(id, status);
  },
  async deleteEnquiry(id) {
    local.deleteEnquiry(id);
  },
  async updateSettings(s) {
    local.updateSettings(s);
  },
  async updateContent(c) {
    local.updateContent(c);
  },
  async saveHeroLayout(l) {
    local.saveHeroLayout(l);
  },
  async clearHeroLayout() {
    local.clearHeroLayout();
  },
  async changePasscode(current, next) {
    const { changePasscode } = await import("./adminAuth");
    return changePasscode(current, next);
  },
  async uploadImage(file) {
    const { fileToCompactDataUrl } = await import("./upload");
    const url = await fileToCompactDataUrl(file);
    return { url: url ?? "" };
  },
};

/** Convex implementation of the admin ops (passcode-guarded server-side). */
export function convexAdminOps(passcode: string): AdminOps {
  const client = getConvexClient()!;
  return {
    async upsertProduct(p) {
      await client.mutation(api.site.upsertProduct, {
        id: p.id || undefined,
        name: p.name,
        category: p.category,
        tagline: p.tagline,
        description: p.description,
        image: p.image,
        imageStorageId: p.imageStorageId,
        specs: p.specs,
        variants: p.variants ?? [],
        priceNote: p.priceNote,
        featured: p.featured,
        sortOrder: p.sortOrder,
        passcode,
      });
    },
    async deleteProduct(id) {
      await client.mutation(api.site.deleteProduct, { id: id as any, passcode });
    },
    async setProductVariants(productId, variants) {
      await client.mutation(api.site.setProductVariants, { id: productId as any, variants, passcode });
    },
    async upsertGalleryItem(g) {
      await client.mutation(api.site.upsertGalleryItem, {
        id: g.id || undefined,
        title: g.title,
        kind: g.kind,
        image: g.image,
        imageStorageId: g.imageStorageId,
        videoUrl: g.videoUrl,
        passcode,
      });
    },
    async deleteGalleryItem(id) {
      await client.mutation(api.site.deleteGalleryItem, { id: id as any, passcode });
    },
    async setReviewStatus(id, status) {
      await client.mutation(api.site.setReviewStatus, { id: id as any, status, passcode });
    },
    async deleteReview(id) {
      await client.mutation(api.site.deleteReview, { id: id as any, passcode });
    },
    async setEnquiryStatus(id, status) {
      await client.mutation(api.site.setEnquiryStatus, { id: id as any, status, passcode });
    },
    async deleteEnquiry(id) {
      await client.mutation(api.site.deleteEnquiry, { id: id as any, passcode });
    },
    async updateSettings(s) {
      await client.mutation(api.site.updateSettings, {
        phone: s.phone,
        phoneAlt: s.phoneAlt,
        email: s.email,
        address: s.address,
        facebook: s.facebook,
        youtube: s.youtube,
        showPrices: s.showPrices,
        priceListDate: s.priceListDate,
        theme: s.theme,
        passcode,
      });
    },
    async updateContent(c) {
      await client.mutation(api.site.updateContent, { content: c as any, passcode });
    },
    async saveHeroLayout(l) {
      await client.mutation(api.site.saveHeroLayout, { layout: l as any, passcode });
    },
    async clearHeroLayout() {
      await client.mutation(api.site.clearHeroLayout, { passcode });
    },
    async changePasscode(current, next) {
      await client.mutation(api.site.changePasscode, { current, next });
      return true;
    },
    async uploadImage(file) {
      const { fileToCompactDataUrl } = await import("./upload");
      const dataUrl = await fileToCompactDataUrl(file);
      if (!dataUrl) return { url: "" };
      const blob = await (await fetch(dataUrl)).blob();
      const uploadUrl = await client.mutation(api.site.generateUploadUrl, { passcode });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });
      const { storageId } = (await res.json()) as { storageId: string };
      const url = (await client.query(api.site.getImageUrl, { storageId: storageId as any })) as string;
      return { url, storageId };
    },
  };
}

/** Recent change-log entries (Convex when connected, local otherwise). */
export async function fetchActivity(): Promise<ActivityEntry[]> {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      try {
        const rows = (await client.query(api.site.listActivity, {})) as Array<{
          _id: string;
          kind: ActivityEntry["kind"];
          summary: string;
          detail?: string;
          byAdmin: boolean;
          createdAt: number;
        }>;
        return rows.map((r) => ({ id: r._id, kind: r.kind, summary: r.summary, detail: r.detail, byAdmin: r.byAdmin, createdAt: r.createdAt }));
      } catch {
        return [];
      }
    }
  }
  return local.getSiteData().activity ?? [];
}
