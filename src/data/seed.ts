// Seed data: the generated price-list catalog plus demo gallery/reviews.
import type { GalleryItem, Review, SiteData } from "./types";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS } from "./types";
import { SEED_PRODUCTS } from "./seedCatalog";

export { SEED_PRODUCTS };

export const SEED_GALLERY: GalleryItem[] = [
  {
    id: "g-reel",
    title: "Jagadamba YouTube channel",
    kind: "video",
    image: "/images/products-v2/borewell-casing-pipe.png",
    videoUrl: "https://www.youtube.com/@JagadambaPipeFittings",
  },
  {
    id: "g-installation-guide",
    title: "Installation guide",
    kind: "video",
    image: "/images/products-v2/pvc-p-trap.png",
    videoUrl: "https://www.youtube.com/watch?v=2rIW5WYFHqE",
  },
  {
    id: "g-product-guide",
    title: "CPVC product guide",
    kind: "video",
    image: "/images/products-v2/cpvc-elbow-90.png",
    videoUrl: "https://www.youtube.com/watch?v=utWwcfOKuq0",
  },
  {
    id: "g-site-bharatpur",
    title: "Site — Bharatpur",
    kind: "photo",
    image: "/images/products-v2/green-tank.png",
  },
  {
    id: "g-site-pokhara",
    title: "Site — Pokhara",
    kind: "photo",
    image: "/images/products-v2/pvc-pipe-bundle.png",
  },
  {
    id: "g-factory-chitwan",
    title: "Factory — Chitwan",
    kind: "photo",
    image: "/images/products-v2/ug-drainage-pipe.png",
  },
  {
    id: "g-black-tank",
    title: "Black water tank",
    kind: "photo",
    image: "/images/products-v2/black-tank.png",
  },
  {
    id: "g-elbow-detail",
    title: "Elbow details",
    kind: "photo",
    image: "/images/products-v2/cpvc-elbow-90.png",
  },
  {
    id: "g-p-trap",
    title: "P-trap finishing detail",
    kind: "photo",
    image: "/images/products-v2/pvc-p-trap.png",
  },
  {
    id: "g-pipe-bundle",
    title: "Pipe bundle ready for dispatch",
    kind: "photo",
    image: "/images/products-v2/pvc-pipe-bundle.png",
  },
  {
    id: "g-square-jali",
    title: "Square tile with jali",
    kind: "photo",
    image: "/images/products-v2/pvc-square-tile-jali.png",
  },
  {
    id: "g-metal-clip",
    title: "Metal pipe clip",
    kind: "photo",
    image: "/images/products-v2/pvc-metal-clip.png",
  },
];

export const SEED_REVIEWS: Review[] = [
  {
    id: "r-meghnath",
    name: "Meghnath Baral",
    business: "Jagadamba Sales Point, Bharatpur",
    rating: 5,
    quote:
      "Consistent supply and consistent quality — our customers ask for Jagadamba pipe by name.",
    status: "approved",
    createdAt: Date.parse("2026-06-02"),
  },
  {
    id: "r-sandip",
    name: "Sandip Sharma",
    business: "Sandip Hardware, Sirjana Chowk, Pokhara",
    rating: 5,
    quote: "Fittings hold up on-site even in Pokhara's tougher installation conditions.",
    status: "approved",
    createdAt: Date.parse("2026-06-20"),
  },
  {
    id: "r-achut",
    name: "Achut Gautam",
    business: "Rukmini Trading Pvt. Ltd., Nepalgunj",
    rating: 5,
    quote: "A dependable partner for our region — orders arrive on schedule, every time.",
    status: "approved",
    createdAt: Date.parse("2026-07-11"),
  },
];

export function buildSeedData(): SiteData {
  return {
    products: SEED_PRODUCTS.map((p) => ({
      ...p,
      specs: [...p.specs],
      variants: (p.variants ?? []).map((v) => ({ ...v })),
    })),
    gallery: SEED_GALLERY.map((g) => ({ ...g })),
    reviews: SEED_REVIEWS.map((r) => ({ ...r })),
    enquiries: [],
    settings: { ...DEFAULT_SETTINGS },
    content: JSON.parse(JSON.stringify(DEFAULT_CONTENT)) as SiteData["content"],
  };
}
