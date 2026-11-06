import type { Product } from "./types";

export function formatRs(n: number): string {
  return `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })}`;
}

const numericPrices = (p: Product): number[] =>
  (p.variants ?? []).map((v) => v.price).filter((x): x is number => typeof x === "number");

/** Water tanks are priced per litre of capacity, not per tank: a bare "Rs 10" would be misleading. */
export function isPerLitre(p: Product): boolean {
  return /tank/i.test(p.category) || (p.variants ?? []).some((v) => /per\s*litre/i.test(`${v.size} ${v.spec ?? ""}`));
}

/** Short price text for cards and chips, always with its unit. null when there is nothing to show. */
export function priceSummary(p: Product, showPrices: boolean): string | null {
  if (!showPrices) return null;
  const prices = numericPrices(p);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (isPerLitre(p)) {
    return min === max ? `${formatRs(min)} per litre` : `${formatRs(min)}–${max.toLocaleString("en-IN", { maximumFractionDigits: 1 })} per litre`;
  }
  return `From ${formatRs(min)}`;
}

export const rateHeading = (p: Product): string => (isPerLitre(p) ? "Rate per litre" : "Rate");
export const rateCell = (p: Product, price: number): string => (isPerLitre(p) ? `${formatRs(price)} / litre` : formatRs(price));
