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

export type ProductGroupId = "pipes" | "fittings" | "tanks";

export interface ProductGroup {
  id: ProductGroupId;
  label: string;
  eyebrow: string;
  description: string;
  categories: ProductCategory[];
  accent: string;
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: "pipes",
    label: "Pipes",
    eyebrow: "PRESSURE + DRAINAGE",
    description: "HDPE, PVC and CPVC pipe for water networks, borewells and site infrastructure.",
    categories: ["HDPE Pipe", "PVC Pipe", "CPVC Pipe"],
    accent: "cyan",
  },
  {
    id: "fittings",
    label: "Fittings",
    eyebrow: "CONNECT + CONTROL",
    description: "Precision-molded elbows, tees, valves, traps and transitions that keep every line connected.",
    categories: ["PVC Fittings", "CPVC Fittings"],
    accent: "red",
  },
  {
    id: "tanks",
    label: "Water tanks",
    eyebrow: "STORE + SUPPLY",
    description: "Reliable storage for homes, institutions and dealer inventory across Nepal.",
    categories: ["Water Tank"],
    accent: "gold",
  },
];

export function productGroupFor(category: ProductCategory): ProductGroup {
  return PRODUCT_GROUPS.find((group) => group.categories.includes(category)) ?? PRODUCT_GROUPS[0];
}

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
  /** Public contact numbers from the original site (056-528831, 056-521340). */
  phoneAlt?: string;
  /** Active visual theme id (see src/data/themes.ts). */
  theme?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: "+977-56-528831",
  phoneAlt: "056-521340",
  email: "info@jagadambaplastic.com",
  address: "Bharatpur-4, Chitwan, Narayanghat, Nepal",
  facebook: "https://www.facebook.com/jagadambaplasticindustry",
  youtube: "https://www.youtube.com/@JagadambaPipeFittings",
  showPrices: true,
  priceListDate: "2082/09/01",
  theme: "heritage-cream",
};

/* ---------------- editable site content (hero + about) ---------------- */

/** One leadership message card on the About page. */
export interface Leader {
  id: string;
  role: string;
  name: string;
  /** Nepali role label, e.g. निर्देशक */
  nepaliRole: string;
  message: string;
  /** Initials shown when no photo is uploaded. */
  initials: string;
  /** Optional uploaded portrait (URL, data URL or Convex storage URL). */
  image?: string;
  imageStorageId?: string;
}

/** Every word on the site the admin can edit from Admin → Content. */
export interface SiteContent {
  /** Home hero */
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSub: string;
  /** Home stats band labels stay fixed; the about story below is editable. */
  aboutStory1: string;
  aboutStory2: string;
  /** About page hero */
  aboutTitle: string;
  aboutSub: string;
  /** Leadership messages (Director / MD) with photo uploads. */
  leaders: Leader[];
}

export const DEFAULT_CONTENT: SiteContent = {
  heroEyebrow: "BHARATPUR, CHITWAN · EST. 2063 B.S.",
  heroTitleLine1: "Piping Nepal's",
  heroTitleLine2: "growth, since the ground up.",
  heroSub:
    "HDPE, PVC and CPVC pipes, fittings and water tanks manufactured in Chitwan and trusted on sites across Nepal — from household plumbing to national infrastructure.",
  aboutStory1:
    "Jagadamba Plastic Industries has manufactured HDPE, PVC and CPVC pipe, fittings and water tanks in Bharatpur, Chitwan since 2063 B.S. What began as a single extrusion line now spans six product families feeding a dealer network that stretches from Province 1 to Province 7. Every batch is pressure-tested and dimension-checked against Nepal Standard — that discipline is why contractors ask for Jagadamba pipe by name, and why our dealers restock with confidence.",
  aboutStory2:
    "Jagadamba Plastic Pvt. Ltd. is an enterprise that spans research, design, manufacture and marketing — strictly conformed to international standards and built on advanced technology, with the entire manufacturing, design and testing carried out by our qualified team of engineers and experts on a regular basis.",
  aboutTitle: "Built for every water need in Nepal.",
  aboutSub:
    "Government-certified plastic pipe and water storage manufacturing in Bharatpur, Chitwan — supplying dealers across all seven provinces, district 1 to 77.",
  leaders: [
    {
      id: "leader-director",
      role: "Director",
      name: "Jagadamba Plastic Industries Pvt. Ltd.",
      nepaliRole: "निर्देशक",
      message:
        "JAGADAMBA PLASTIC PVT. LTD. was established in 2063 B.S., which proved to be the milestone of the Manakamana Group that everyone knows today. It has learned from the past and strived to make a better future in the plastic sector by putting all efforts into invention, innovation, reformation, replacement and market extension. Jagadamba Plastic Pvt. Ltd. is an enterprise including research, design, manufacture and marketing departments — strictly conformed to international standards and built on the introduction of advanced technology. We are striving for the perfect service to completely show our corporate image and product brand.",
      initials: "JP",
    },
    {
      id: "leader-md",
      role: "Managing Director",
      name: "Manakamana Group",
      nepaliRole: "प्रबन्ध निर्देशक",
      message:
        "The entire manufacturing, designing and testing are carried out by our qualified team of engineers and experts on a regular basis. Our various products are certified with NS by the Government of Nepal. Today we are proud and thankful that we are being loved and are able to be one of the best plastic industries in our country, overcoming all the needs and desires of our customers. It is all because of our customers, employees, distributors and advisors that we are able to stand at the peak — and we will keep on serving and fulfilling our customer needs and desires, the way we are doing now.",
      initials: "MG",
    },
  ],
};

/* ---------------- hero product-group arrangement ---------------- */

/** Placement of one chip in the home hero product group. Coordinates match
 * the arrange-controller tool committed in home-page-product-group-arranger:
 * stage-local px from the anchor (left 50%, top 52%), plus depth and size. */
export interface HeroChip {
  /** Product id the chip renders. */
  productId: string;
  bx: number;
  by: number;
  z: number;
  /** Optional overrides; omitted = stylesheet default. */
  w?: number;
  h?: number;
}

export interface HeroChipLayout {
  version: 1;
  chips: HeroChip[];
  updatedAt?: number;
  updatedBy?: string;
}

/* ---------------- activity log ---------------- */

export type ActivityKind =
  | "product"
  | "gallery"
  | "review"
  | "enquiry"
  | "content"
  | "settings"
  | "layout"
  | "admin"
  | "theme";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  /** Short human summary, e.g. 'Product updated — Green Water Tank'. */
  summary: string;
  detail?: string;
  /** true when the change was made through the admin panel. */
  byAdmin: boolean;
  createdAt: number;
}

/** Everything persisted to localStorage in one namespaced record. */
export interface SiteData {
  products: Product[];
  gallery: GalleryItem[];
  reviews: Review[];
  enquiries: Enquiry[];
  settings: SiteSettings;
  content?: SiteContent;
  heroLayout?: HeroChipLayout;
  activity?: ActivityEntry[];
}
