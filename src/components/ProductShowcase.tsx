import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { HeroChipLayout, Product } from "../data/types";
import { useSiteData } from "../data/SiteDataProvider";

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 560;

interface OrbitItem {
  product: Product;
  cls: string;
  bx: number;
  by: number;
  z: number;
  w?: string;
  h?: string;
  sx?: number;
  sy?: number;
  srot?: number;
}

/** Visual family of a chip: tanks are large, pipes tall, fittings compact. */
function chipClassFor(product: Product): string {
  if (product.category === "Water Tank") return "chip-tank";
  if (product.category === "HDPE Pipe" || product.category === "PVC Pipe" || product.category === "CPVC Pipe") {
    return "chip-pipe";
  }
  return "chip-round";
}

/** The built-in arrangement uses the same coordinate space as Admin → Homepage designer. */
function buildDefaultSlots(products: Product[]): OrbitItem[] {
  const byName = (needle: string) => products.find((product) => product.name.toLowerCase().includes(needle));
  const layout: Array<{ match: string; cls: string; bx: number; by: number; z: number; w?: string; h?: string }> = [
    { match: "jagadamba water tank", cls: "chip-tank", bx: -40, by: -160, z: 3 },
    { match: "black tank", cls: "chip-tank chip-tank-b", bx: 44, by: -150, z: 4 },
    { match: "borewell", cls: "chip-pipe", bx: 110, by: -130, z: 2 },
    { match: "ug drainage", cls: "chip-pipe", bx: 138, by: -110, z: 2 },
    { match: "hdpe pipe", cls: "chip-pipe", bx: 148, by: -90, z: 2 },
    { match: "ns upvc", cls: "chip-pipe chip-pipe-lg", bx: -116, by: -140, z: 2 },
    { match: "cpvc pipe sdr", cls: "chip-pipe", bx: -156, by: -120, z: 2 },
    { match: "pvc pipe (commercial)", cls: "chip-pipe", bx: -186, by: -100, z: 1 },
    { match: "cpvc elbow 90", cls: "chip-round", bx: -59, by: 50, z: 4 },
    { match: "cpvc elbow 45", cls: "chip-round", bx: -156, by: 20, z: 4 },
    { match: "cross tee", cls: "chip-round", bx: -213, by: 36, z: 4 },
    { match: "cpvc union", cls: "chip-round", bx: -213, by: 24, z: 4 },
    { match: "concealed valve", cls: "chip-round", bx: -107, by: 6, z: 4 },
    { match: "reducing tee", cls: "chip-round", bx: -55, by: -5, z: 4 },
    { match: "male thread", cls: "chip-round", bx: 23, by: -11, z: 4 },
    { match: "double tee", cls: "chip-round", bx: 6, by: 55, z: 4 },
    { match: "single tee", cls: "chip-round", bx: 68, by: 46, z: 4 },
    { match: "coupler", cls: "chip-round", bx: 120, by: 32, z: 4 },
    { match: "bend 45", cls: "chip-round", bx: 146, by: -34, z: 4 },
    { match: "end cap", cls: "chip-round", bx: 177, by: 46, z: 4 },
    { match: "p trap", cls: "chip-round", bx: 198, by: -8, z: 4 },
  ];

  const items: OrbitItem[] = [];
  const used = new Set<string>();
  for (const slot of layout) {
    const product = byName(slot.match);
    if (product && !used.has(product.id)) {
      used.add(product.id);
      items.push({ product, ...slot });
    }
  }

  let extra = 0;
  for (const product of products) {
    if (items.length >= 24) break;
    if (used.has(product.id) || !product.featured) continue;
    used.add(product.id);
    const angle = (extra / 10) * Math.PI * 2;
    items.push({
      product,
      cls: "chip-round",
      bx: Math.cos(angle) * 260,
      by: Math.sin(angle) * 60,
      z: 1,
    });
    extra += 1;
  }
  return items;
}

/** Admin coordinates are rendered exactly; deleted products are skipped safely. */
function buildFromSaved(products: Product[], saved: HeroChipLayout): OrbitItem[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return saved.chips.flatMap((chip) => {
    const product = byId.get(chip.productId);
    if (!product) return [];
    return [{
      product,
      cls: chipClassFor(product),
      bx: chip.bx,
      by: chip.by,
      z: chip.z,
      w: chip.w != null ? `${chip.w}px` : undefined,
      h: chip.h != null ? `${chip.h}px` : undefined,
    }];
  });
}

function buildScatterSlots(count: number): Array<{ sx: number; sy: number; srot: number }> {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
    const ring = index % 3;
    const radiusX = 250 + ring * 24;
    const radiusY = 145 + (index % 2) * 24;
    return {
      sx: Math.round(Math.cos(angle) * radiusX),
      sy: Math.round(Math.sin(angle) * radiusY),
      srot: Math.round((index % 2 ? 1 : -1) * (3 + (index % 5) * 2)),
    };
  });
}

/** Public WYSIWYG product family. The admin layout remains intact at every breakpoint. */
export function ProductShowcase() {
  const { products, heroLayout } = useSiteData();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [layoutMode, setLayoutMode] = useState<"grouped" | "scattered">("grouped");
  const hasSavedLayout = Boolean(heroLayout?.chips?.length);

  const items = useMemo(
    () => (hasSavedLayout ? buildFromSaved(products, heroLayout!) : buildDefaultSlots(products)),
    [hasSavedLayout, heroLayout, products],
  );
  const scatterSlots = useMemo(() => buildScatterSlots(items.length), [items.length]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fitStage = () => {
      const scale = Math.min(1, Math.max(0.36, stage.clientWidth / STAGE_WIDTH));
      stage.style.setProperty("--showcase-scale", scale.toFixed(3));
      stage.style.setProperty("--showcase-height", `${Math.round(STAGE_HEIGHT * scale)}px`);
    };
    fitStage();
    const observer = new ResizeObserver(fitStage);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-visual-col">
      <div className="showcase-heading">
        <span className="showcase-heading-label">JAGADAMBA PLASTIC</span>
        <span className="showcase-heading-title">Our Range of Products</span>
        <div className="core-note">
          {hasSavedLayout
            ? `${items.length} products · arrangement saved from the homepage designer`
            : `${items.length} products from our complete range`}
        </div>
        <div className="showcase-mode-switch" role="group" aria-label="Product arrangement mode">
          <button
            type="button"
            className={layoutMode === "grouped" ? "active" : ""}
            aria-pressed={layoutMode === "grouped"}
            onClick={() => setLayoutMode("grouped")}
          >
            Grouped
          </button>
          <button
            type="button"
            className={layoutMode === "scattered" ? "active" : ""}
            aria-pressed={layoutMode === "scattered"}
            onClick={() => setLayoutMode("scattered")}
          >
            Scattered
          </button>
        </div>
      </div>
      <div
        className="hero-visual"
        ref={stageRef}
        data-layout-source={hasSavedLayout ? "admin" : "default"}
        data-layout-mode={layoutMode}
      >
        <div className={`showcase-orbit ${layoutMode}`} id="showcaseOrbit">
          <div className="showcase-pool" aria-hidden="true">
            <div className="glow" />
            <div className="ripple" />
            <div className="ripple r2" />
            <div className="ripple r3" />
          </div>
          {items.map(({ product, cls, bx, by, z, w, h }, index) => {
            const scatter = scatterSlots[index];
            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className={`orbit-chip ${cls}`}
                style={{
                  "--bx": `${bx}px`,
                  "--by": `${by}px`,
                  "--sx": `${scatter.sx}px`,
                  "--sy": `${scatter.sy}px`,
                  "--srot": `${scatter.srot}deg`,
                  "--z": z,
                  width: w,
                  height: h,
                } as React.CSSProperties}
              >
                <span className="chip-disc">
                  <img src={product.image} alt={product.name} loading="lazy" />
                </span>
                <span className="chip-label">{product.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
