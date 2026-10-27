import type { HeroChip, HeroChipLayout, HeroChipMotion, Product } from "../data/types";

export const SHOWCASE_STAGE = {
  width: 900,
  height: 560,
  anchorX: 450,
  anchorY: 560 * 0.52,
} as const;

export const SHOWCASE_MOTION_BOUNDS = {
  scatterSpread: { min: 0.65, max: 1.35, step: 0.05 },
  durationMs: { min: 200, max: 2000, step: 50 },
  tiltDeg: { min: 0, max: 55, step: 1 },
} as const;

export const DEFAULT_SHOWCASE_MOTION: Required<HeroChipMotion> = {
  scatterSpread: 1,
  durationMs: 1100,
  tiltDeg: 28,
};

export const HERO_CHIP_BOUNDS = {
  bx: { min: -900, max: 900 },
  by: { min: -560, max: 560 },
  z: { min: -40, max: 40 },
  size: { min: 30, max: 360 },
} as const;

export interface ShowcaseItem extends HeroChip {
  product: Product;
  className: string;
}

export interface ScatterPlacement {
  x: number;
  y: number;
  rotation: number;
}

const DEFAULT_SLOTS: Array<HeroChip & { match: string; className?: string }> = [
  { match: "jagadamba water tank", productId: "", bx: -40, by: -160, z: 3 },
  { match: "black tank", productId: "", bx: 44, by: -150, z: 4, className: "chip-tank chip-tank-b" },
  { match: "borewell", productId: "", bx: 110, by: -130, z: 2 },
  { match: "ug drainage", productId: "", bx: 138, by: -110, z: 2 },
  { match: "hdpe pipe", productId: "", bx: 148, by: -90, z: 2 },
  { match: "ns upvc", productId: "", bx: -116, by: -140, z: 2, className: "chip-pipe chip-pipe-lg" },
  { match: "cpvc pipe sdr", productId: "", bx: -156, by: -120, z: 2 },
  { match: "pvc pipe (commercial)", productId: "", bx: -186, by: -100, z: 1 },
  { match: "cpvc elbow 90", productId: "", bx: -59, by: 50, z: 4 },
  { match: "cpvc elbow 45", productId: "", bx: -156, by: 20, z: 4 },
  { match: "cross tee", productId: "", bx: -213, by: 36, z: 4 },
  { match: "cpvc union", productId: "", bx: -213, by: 24, z: 4 },
  { match: "concealed valve", productId: "", bx: -107, by: 6, z: 4 },
  { match: "reducing tee", productId: "", bx: -55, by: -5, z: 4 },
  { match: "male thread", productId: "", bx: 23, by: -11, z: 4 },
  { match: "double tee", productId: "", bx: 6, by: 55, z: 4 },
  { match: "single tee", productId: "", bx: 68, by: 46, z: 4 },
  { match: "coupler", productId: "", bx: 120, by: 32, z: 4 },
  { match: "bend 45", productId: "", bx: 146, by: -34, z: 4 },
  { match: "end cap", productId: "", bx: 177, by: 46, z: 4 },
  { match: "p trap", productId: "", bx: 198, by: -8, z: 4 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function normalizeShowcaseMotion(motion?: HeroChipMotion | null): Required<HeroChipMotion> {
  return {
    scatterSpread: round(clamp(finite(motion?.scatterSpread, DEFAULT_SHOWCASE_MOTION.scatterSpread), SHOWCASE_MOTION_BOUNDS.scatterSpread.min, SHOWCASE_MOTION_BOUNDS.scatterSpread.max), 2),
    durationMs: Math.round(clamp(finite(motion?.durationMs, DEFAULT_SHOWCASE_MOTION.durationMs), SHOWCASE_MOTION_BOUNDS.durationMs.min, SHOWCASE_MOTION_BOUNDS.durationMs.max)),
    tiltDeg: Math.round(clamp(finite(motion?.tiltDeg, DEFAULT_SHOWCASE_MOTION.tiltDeg), SHOWCASE_MOTION_BOUNDS.tiltDeg.min, SHOWCASE_MOTION_BOUNDS.tiltDeg.max)),
  };
}

/** Normalize untrusted/imported layout rows and omit absent optional sizes. */
export function normalizeHeroChip(chip: HeroChip): HeroChip | null {
  if (!chip || typeof chip.productId !== "string" || !chip.productId.trim()) return null;
  const normalized: HeroChip = {
    productId: chip.productId,
    bx: round(clamp(finite(chip.bx, 0), HERO_CHIP_BOUNDS.bx.min, HERO_CHIP_BOUNDS.bx.max)),
    by: round(clamp(finite(chip.by, 0), HERO_CHIP_BOUNDS.by.min, HERO_CHIP_BOUNDS.by.max)),
    z: Math.round(clamp(finite(chip.z, 1), HERO_CHIP_BOUNDS.z.min, HERO_CHIP_BOUNDS.z.max)),
  };
  if (typeof chip.w === "number" && Number.isFinite(chip.w)) {
    normalized.w = Math.round(clamp(chip.w, HERO_CHIP_BOUNDS.size.min, HERO_CHIP_BOUNDS.size.max));
  }
  if (typeof chip.h === "number" && Number.isFinite(chip.h)) {
    normalized.h = Math.round(clamp(chip.h, HERO_CHIP_BOUNDS.size.min, HERO_CHIP_BOUNDS.size.max));
  }
  return normalized;
}

export function productChipClass(product: Product): string {
  const name = product.name.toLowerCase();
  if (product.category === "Water Tank") return name.includes("black") ? "chip-tank chip-tank-b" : "chip-tank";
  if (["HDPE Pipe", "PVC Pipe", "CPVC Pipe"].includes(product.category)) {
    return name.includes("ns upvc") ? "chip-pipe chip-pipe-lg" : "chip-pipe";
  }
  return "chip-round";
}

export function defaultChipSize(product: Product, className = productChipClass(product)): { w: number; h: number } {
  if (className.includes("chip-tank-b")) return { w: 104, h: 142 };
  if (className.includes("chip-tank")) return { w: 122, h: 158 };
  if (className.includes("chip-pipe-lg")) return { w: 76, h: 190 };
  if (className.includes("chip-pipe")) return { w: 56, h: 150 };
  return { w: 76, h: 76 };
}

export function buildDefaultHeroChips(products: Product[]): HeroChip[] {
  const chips: HeroChip[] = [];
  const used = new Set<string>();
  for (const slot of DEFAULT_SLOTS) {
    const product = products.find((candidate) => candidate.name.toLowerCase().includes(slot.match));
    if (!product || used.has(product.id)) continue;
    used.add(product.id);
    chips.push({ productId: product.id, bx: slot.bx, by: slot.by, z: slot.z });
  }
  let extra = 0;
  for (const product of products) {
    if (chips.length >= 24) break;
    if (used.has(product.id) || !product.featured) continue;
    used.add(product.id);
    const angle = (extra / 10) * Math.PI * 2;
    chips.push({ productId: product.id, bx: Math.cos(angle) * 260, by: Math.sin(angle) * 60, z: 1 });
    extra += 1;
  }
  return chips;
}

/** `undefined` means use defaults; a saved layout with zero chips stays empty. */
export function resolveShowcaseItems(products: Product[], layout?: HeroChipLayout): ShowcaseItem[] {
  const source = layout === undefined ? buildDefaultHeroChips(products) : layout.chips;
  const byId = new Map(products.map((product) => [product.id, product]));
  const used = new Set<string>();
  const items: ShowcaseItem[] = [];
  for (const rawChip of source) {
    const chip = normalizeHeroChip(rawChip);
    if (!chip || used.has(chip.productId)) continue;
    const product = byId.get(chip.productId);
    if (!product) continue;
    used.add(chip.productId);
    const slot = DEFAULT_SLOTS.find((candidate) => product.name.toLowerCase().includes(candidate.match));
    items.push({ ...chip, product, className: slot?.className ?? productChipClass(product) });
  }
  return items;
}

function stableUnit(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

/** Deterministic version of the prototype's angle-sorted radial scatter. */
export function buildScatterPlacements(
  items: Array<Pick<ShowcaseItem, "productId" | "bx" | "by" | "className">>,
  motion: HeroChipMotion = DEFAULT_SHOWCASE_MOTION,
): Map<string, ScatterPlacement> {
  const settings = normalizeShowcaseMotion(motion);
  const ordered = [...items].sort((a, b) => Math.atan2(a.bx, -a.by) - Math.atan2(b.bx, -b.by));
  const placements = new Map<string, ScatterPlacement>();
  const slot = 360 / Math.max(ordered.length, 1);
  ordered.forEach((item, index) => {
    const large = /chip-(tank|pipe|coil)/.test(item.className);
    const jitter = (stableUnit(`${item.productId}:angle`) * 2 - 1) * slot * (large ? 0.32 : 0.22);
    const angle = index * slot + jitter;
    const radians = (angle * Math.PI) / 180;
    const baseDistance = large
      ? 270 + stableUnit(`${item.productId}:distance`) * 48
      : 165 + stableUnit(`${item.productId}:distance`) * 38;
    const distance = baseDistance * settings.scatterSpread;
    placements.set(item.productId, {
      x: Math.sin(radians) * distance,
      y: -Math.cos(radians) * distance * 0.78,
      rotation: (stableUnit(`${item.productId}:tilt`) * 2 - 1) * settings.tiltDeg,
    });
  });
  return placements;
}

export function interpolatePlacement(
  item: Pick<ShowcaseItem, "bx" | "by">,
  scatter: ScatterPlacement | undefined,
  progress: number,
): ScatterPlacement {
  const target = scatter ?? { x: item.bx, y: item.by, rotation: 0 };
  return {
    x: item.bx + (target.x - item.bx) * progress,
    y: item.by + (target.y - item.by) * progress,
    rotation: target.rotation * progress,
  };
}
