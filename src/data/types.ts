// Shared data models used by both the public site and the admin panel.

/** One purchasable size/grade variant of a product. */
export interface ProductVariant {
  id: string;
  /** e.g. "1/2\"" or "25mm" or "100 ml" */
  size: string;
  /** Optional secondary dimension, e.g. "SDR 11" or "PN16" */
  spec?: string;
  /** Price in NPR (or per-litre rate for tanks). Omit to hide on this row. */
  price?: number;
  /** Optional packing info, e.g. "Pcs/box: 100" */
  packing?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  image: string; // URL — /images/... , a data: URL (local mode) or a Convex storage URL
  imageStorageId?: string; // set when the image lives in Convex file storage
  specs: string[];
  variants: ProductVariant[];
  /** Human note shown under the price table, e.g. tank per-litre rules. */
  priceNote?: string;
  featured: boolean;
  sortOrder: number;
}

export type ProductCategory =
  | "HDPE Pipe"
  | "PVC Pipe"
  | "CPVC Pipe"
  | "PVC Fittings"
  | "CPVC Fittings"
  | "Water Tank";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "HDPE Pipe",
  "PVC Pipe",
  "CPVC Pipe",
  "PVC Fittings",
  "CPVC Fittings",
  "Water Tank",
];

export interface GalleryItem {
  id: string;
  title: string;
  kind: "photo" | "video";
  image: string; // URL — /images/... , a data: URL (local mode) or a Convex storage URL
  imageStorageId?: string; // set when the image lives in Convex file storage
  videoUrl?: string; // optional link out for video tiles
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  name: string;
  business?: string;
  rating: number; // 1..5
  quote: string;
  status: ReviewStatus;
  createdAt: number;
}

export type EnquiryStatus = "new" | "read" | "archived";

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  interest: string;
  message: string;
  status: EnquiryStatus;
  createdAt: number;
}

export interface SiteSettings {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  youtube: string;
  /** Admin toggle: show product prices publicly. Default on. */
  showPrices: boolean;
  /** Effective date label for the price list, e.g. "2082/09/01". */
  priceListDate: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: "+977-56-000000",
  email: "info@jagadambaplastic.com",
  address: "Bharatpur-4, Chitwan, Narayanghat, Nepal",
  facebook: "https://www.facebook.com/jagadambaplasticindustry",
  youtube: "https://www.youtube.com/@JagadambaPipeFittings",
  showPrices: true,
  priceListDate: "2082/09/01",
};

/** Everything persisted to localStorage in one namespaced record. */
export interface SiteData {
  products: Product[];
  gallery: GalleryItem[];
  reviews: Review[];
  enquiries: Enquiry[];
  settings: SiteSettings;
}
