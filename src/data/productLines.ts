import type { Product } from "./types";
import { PRODUCT_GROUPS, productGroupFor } from "./types";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** 8 -> "Eight" (used for headings such as "Eight lines, one standard."). */
export const numberWord = (n: number): string => {
  const w = WORDS[n] ?? String(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

/**
 * One card per product line: the featured products, plus a representative of every category that has
 * none yet (so PVC and CPVC fittings are shown too). Ordered Pipes → Fittings → Water tanks.
 */
export function selectProductLines(products: Product[]): Product[] {
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const seen = new Set(featured.map((p) => p.category));
  const extra: Product[] = [];
  for (const p of [...products].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!seen.has(p.category)) {
      seen.add(p.category);
      extra.push(p);
    }
  }
  const all = [...featured, ...extra].slice(0, 12);
  const rank = (p: Product) => PRODUCT_GROUPS.findIndex((g) => g.id === productGroupFor(p.category).id);
  return all.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map((x) => x.p);
}
