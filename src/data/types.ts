// Shared data models used by both the public site and the admin panel.

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  image: string; // URL — /images/products/... , a data: URL (local mode) or a Convex storage URL
  imageStorageId?: string; // set when the image lives in Convex file storage
  specs: string[];
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
}

/** Everything persisted to localStorage in one namespaced record. */
export interface SiteData {
  products: Product[];
  gallery: GalleryItem[];
  reviews: Review[];
  enquiries: Enquiry[];
  settings: SiteSettings;
}
