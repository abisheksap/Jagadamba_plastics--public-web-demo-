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

/** Change the admin passcode in whichever backend is active (see adminAuth.changePasscode). */
export async function changePasscodeAnywhere(current: string, next: string): Promise<{ ok: boolean; message: string }> {
  const { changePasscode } = await import("./adminAuth");
  return changePasscode(current, next);
}

// ---------- public form submissions ----------

export async function submitEnquiry(
  input: Pick<Enquiry, "name" | "phone" | "interest" | "message"> & { hp?: string },
) {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      await client.mutation(api.site.submitEnquiry, input);
      return;
    }
  }
  if (input.hp) return; // bot caught by the hidden field
  const { hp: _hp, ...clean } = input;
  local.submitEnquiry(clean);
}

export async function submitReview(
  input: Pick<Review, "name" | "business" | "rating" | "quote"> & { hp?: string },
) {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      await client.mutation(api.site.submitReview, input);
      return;
    }
  }
  if (input.hp) return;
  const { hp: _hp, ...clean } = input;
  local.submitReview(clean);
}

// ---------- admin operations (a signed-in admin session is required in convex mode) ----------

export interface AdminOps {
  upsertProduct(p: any): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  setProductVariants(productId: string, variants: ProductVariant[]): Promise<void>;
  upsertGalleryItem(g: any): Promise<void>;
  deleteGalleryItem(id: string): Promise<void>;
  upsertDocument(d: any): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  setReviewStatus(id: string, status: Review["status"]): Promise<void>;
  deleteReview(id: string): Promise<void>;
  setEnquiryStatus(id: string, status: Enquiry["status"]): Promise<void>;
  deleteEnquiry(id: string): Promise<void>;
  updateSettings(s: SiteData["settings"]): Promise<void>;
  updateContent(c: SiteContent): Promise<void>;
  saveHeroLayout(l: HeroChipLayout): Promise<void>;
  clearHeroLayout(): Promise<void>;
  /** maxEdge: longest side in px after downscaling (default 900; documents use a larger size so text stays readable). */
  uploadImage(file: File, maxEdge?: number): Promise<{ url: string; storageId?: string }>;
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
  async upsertDocument(d) {
    local.upsertDocument(d);
  },
  async deleteDocument(id) {
    local.deleteDocument(id);
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
  async uploadImage(file, maxEdge) {
    const { fileToCompactDataUrl } = await import("./upload");
    const url = await fileToCompactDataUrl(file, maxEdge);
    return { url: url ?? "" };
  },
};

/** Convex implementation of the admin ops (guarded server-side by the admin session token). */
export function convexAdminOps(token: string): AdminOps {
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
        token,
      });
    },
    async deleteProduct(id) {
      await client.mutation(api.site.deleteProduct, { id: id as any, token });
    },
    async setProductVariants(productId, variants) {
      await client.mutation(api.site.setProductVariants, { id: productId as any, variants, token });
    },
    async upsertGalleryItem(g) {
      await client.mutation(api.site.upsertGalleryItem, {
        id: g.id || undefined,
        title: g.title,
        kind: g.kind,
        image: g.image,
        imageStorageId: g.imageStorageId,
        videoUrl: g.videoUrl,
        sortOrder: g.sortOrder,
        token,
      });
    },
    async deleteGalleryItem(id) {
      await client.mutation(api.site.deleteGalleryItem, { id: id as any, token });
    },
    async upsertDocument(d) {
      await client.mutation(api.site.upsertDocument, {
        id: d.id || undefined,
        title: d.title,
        kind: d.kind,
        issuer: d.issuer,
        issuedOn: d.issuedOn,
        validUntil: d.validUntil,
        note: d.note,
        image: d.image ?? "",
        imageStorageId: d.imageStorageId,
        fileUrl: d.fileUrl,
        sortOrder: d.sortOrder,
        token,
      });
    },
    async deleteDocument(id) {
      await client.mutation(api.site.deleteDocument, { id: id as any, token });
    },
    async setReviewStatus(id, status) {
      await client.mutation(api.site.setReviewStatus, { id: id as any, status, token });
    },
    async deleteReview(id) {
      await client.mutation(api.site.deleteReview, { id: id as any, token });
    },
    async setEnquiryStatus(id, status) {
      await client.mutation(api.site.setEnquiryStatus, { id: id as any, status, token });
    },
    async deleteEnquiry(id) {
      await client.mutation(api.site.deleteEnquiry, { id: id as any, token });
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
        token,
      });
    },
    async updateContent(c) {
      await client.mutation(api.site.updateContent, { content: c as any, token });
    },
    async saveHeroLayout(l) {
      await client.mutation(api.site.saveHeroLayout, { layout: l as any, token });
    },
    async clearHeroLayout() {
      await client.mutation(api.site.clearHeroLayout, { token });
    },
    async uploadImage(file, maxEdge) {
      const { fileToCompactDataUrl } = await import("./upload");
      const dataUrl = await fileToCompactDataUrl(file, maxEdge);
      if (!dataUrl) return { url: "" };
      const blob = await (await fetch(dataUrl)).blob();
      const uploadUrl = await client.mutation(api.site.generateUploadUrl, { token });
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
export async function fetchActivity(token = ""): Promise<ActivityEntry[]> {
  if (convexEnabled) {
    const client = getConvexClient();
    if (client) {
      try {
        const rows = (await client.query(api.site.listActivity, { token })) as Array<{
          _id: string;
          kind: ActivityEntry["kind"];
          summary: string;
          detail?: string;
          byAdmin: boolean;
          createdAt: number;
        }>;
        if (!rows) return [];
        return rows.map((r) => ({ id: r._id, kind: r.kind, summary: r.summary, detail: r.detail, byAdmin: r.byAdmin, createdAt: r.createdAt }));
      } catch {
        return [];
      }
    }
  }
  return local.getSiteData().activity ?? [];
}
