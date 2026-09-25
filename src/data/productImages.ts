import { IMAGE_MANIFEST } from "./imageManifest";
import { SEED_PRODUCTS } from "./seedCatalog";
import type { Product } from "./types";

const SHIPPED_IMAGES = new Set(IMAGE_MANIFEST.map(normalizeShippedPath));
const SEED_IMAGES = new Map(SEED_PRODUCTS.map((product) => [product.id, product.image]));

function normalizeShippedPath(path: string): string {
  const withoutPublicPrefix = path.replace(/^\/public(?=\/)/, "");
  return withoutPublicPrefix.startsWith("/") ? withoutPublicPrefix : `/${withoutPublicPrefix}`;
}

function isExternalImage(path: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path);
}

/**
 * Resolve the best public image for a product without changing the stored CMS value.
 * Uploaded Convex files and external/data URLs pass through unchanged. Legacy
 * local paths (including removed JPGs and `/public/...` values) are normalized to
 * shipped PNG assets, with the generated catalog image as the final safe fallback.
 */
export function productImageFor(product: Pick<Product, "id" | "image">): string {
  const source = product.image?.trim() ?? "";
  if (!source || isExternalImage(source)) return source || SEED_IMAGES.get(product.id) || "";

  const normalized = normalizeShippedPath(source.split("?")[0]);
  if (SHIPPED_IMAGES.has(normalized)) return normalized;

  const filename = normalized.split("/").pop() ?? "";
  const stem = filename.replace(/\.[^.]+$/, "");
  if (stem) {
    const catalogPng = `/images/products-v2/${stem}.png`;
    if (SHIPPED_IMAGES.has(catalogPng)) return catalogPng;
  }

  return SEED_IMAGES.get(product.id) ?? normalized;
}
