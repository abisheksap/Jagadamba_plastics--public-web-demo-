// Unified backend helpers used by pages and the admin panel.
// When VITE_CONVEX_URL is configured, writes go to Convex (shared across
// devices and staff). Otherwise everything falls back to the localStorage
// store so the site keeps working standalone.
import { convexEnabled, getConvexClient } from "./convexClient";
import * as local from "./store";
import type { Enquiry, Review, SiteData } from "./types";
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
  upsertGalleryItem(g: any): Promise<void>;
  deleteGalleryItem(id: string): Promise<void>;
  setReviewStatus(id: string, status: Review["status"]): Promise<void>;
  deleteReview(id: string): Promise<void>;
  setEnquiryStatus(id: string, status: Enquiry["status"]): Promise<void>;
  deleteEnquiry(id: string): Promise<void>;
  updateSettings(s: SiteData["settings"]): Promise<void>;
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
        featured: p.featured,
        sortOrder: p.sortOrder,
        passcode,
      });
    },
    async deleteProduct(id) {
      await client.mutation(api.site.deleteProduct, { id, passcode });
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
      await client.mutation(api.site.deleteGalleryItem, { id, passcode });
    },
    async setReviewStatus(id, status) {
      await client.mutation(api.site.setReviewStatus, { id, status, passcode });
    },
    async deleteReview(id) {
      await client.mutation(api.site.deleteReview, { id, passcode });
    },
    async setEnquiryStatus(id, status) {
      await client.mutation(api.site.setEnquiryStatus, { id, status, passcode });
    },
    async deleteEnquiry(id) {
      await client.mutation(api.site.deleteEnquiry, { id, passcode });
    },
    async updateSettings(s) {
      await client.mutation(api.site.updateSettings, { ...s, passcode });
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
      const url = (await client.query(api.site.getImageUrl, { storageId })) as string;
      return { url, storageId };
    },
  };
}
