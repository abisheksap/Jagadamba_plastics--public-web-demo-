import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import type { HeroChipLayout, Product } from "../data/types";
import { useSiteData } from "../data/SiteDataProvider";

interface OrbitItem {
  product: Product;
  cls: string;
  bx: number;
  by: number;
  z: number;
  w?: string;
  h?: string;
}

const starPositions = [
  { left: "57%", top: "71%", delay: 1.29, tw: 0.79 },
  { left: "57%", top: "65%", delay: 1.28, tw: 0.49 },
  { left: "65%", top: "60%", delay: 0.94, tw: 0.8 },
  { left: "12%", top: "57%", delay: 0.46, tw: 0.45 },
  { left: "88%", top: "81%", delay: 0.06, tw: 0.89 },
  { left: "57%", top: "83%", delay: 1.11, tw: 0.73 },
  { left: "79%", top: "1%", delay: 1.25, tw: 0.43 },
  { left: "4%", top: "24%", delay: 1.32, tw: 0.7 },
  { left: "99%", top: "59%", delay: 0.49, tw: 0.7 },
  { left: "25%", top: "66%", delay: 0.35, tw: 0.55 },
  { left: "0%", top: "84%", delay: 0.13, tw: 0.73 },
  { left: "52%", top: "70%", delay: 1.49, tw: 0.82 },
  { left: "90%", top: "32%", delay: 0.47, tw: 0.51 },
  { left: "36%", top: "3%", delay: 0.11, tw: 0.78 },
  { left: "51%", top: "13%", delay: 1.27, tw: 0.59 },
  { left: "2%", top: "87%", delay: 0.0, tw: 0.5 },
  { left: "6%", top: "60%", delay: 0.56, tw: 0.75 },
  { left: "53%", top: "9%", delay: 0.85, tw: 0.5 },
  { left: "86%", top: "34%", delay: 0.51, tw: 0.56 },
  { left: "1%", top: "52%", delay: 1.14, tw: 0.46 },
  { left: "31%", top: "90%", delay: 0.15, tw: 0.43 },
  { left: "62%", top: "22%", delay: 1.02, tw: 0.49 },
];

/** Visual family of a chip: tanks are big discs, pipes tall, fittings round. */
function chipClassFor(p: Product): string {
  if (p.category === "Water Tank") return "chip-tank";
  if (p.category === "HDPE Pipe" || p.category === "PVC Pipe" || p.category === "CPVC Pipe") {
    return "chip-pipe";
  }
  return "chip-round";
}

/** Layout slots for the default family-shot cluster — the two water tanks as the
 * front-centre pair, pipes behind, fittings gathered in front (mirrors the
 * prototype). Match strings are lowercase substrings of product names. */
function buildDefaultSlots(products: Product[]): OrbitItem[] {
  const byName = (needle: string) => products.find((p) => p.name.toLowerCase().includes(needle));
  const layout: Array<{ match: string; cls: string; bx: number; by: number; z: number; w?: string; h?: string }> = [
    // front-centre tank pair — both prominent
    { match: "jagadamba water tank", cls: "chip-tank", bx: -40, by: -42, z: 3, h: "172px" },
    { match: "black tank", cls: "chip-tank chip-tank-b", bx: 44, by: -30, z: 4, w: "104px", h: "142px" },
    // pipes behind
    { match: "borewell", cls: "chip-pipe", bx: 110, by: -20, z: 2 },
    { match: "ug drainage", cls: "chip-pipe", bx: 138, by: -2, z: 2 },
    { match: "hdpe pipe", cls: "chip-pipe", bx: 148, by: 16, z: 2, w: "66px", h: "168px" },
    { match: "ns upvc", cls: "chip-pipe chip-pipe-lg", bx: -116, by: -26, z: 2 },
    { match: "cpvc pipe sdr", cls: "chip-pipe", bx: -156, by: -10, z: 2, w: "60px", h: "155px" },
    { match: "pvc pipe (commercial)", cls: "chip-pipe", bx: -186, by: 8, z: 1 },
    // fittings in front
    { match: "cpvc elbow 90", cls: "chip-round", bx: -59, by: 109, z: 4, w: "64px", h: "61px" },
    { match: "cpvc elbow 45", cls: "chip-round", bx: -156, by: 78, z: 4 },
    { match: "cross tee", cls: "chip-round", bx: -213, by: 94, z: 4 },
    { match: "cpvc union", cls: "chip-round", bx: -213, by: 82, z: 4 },
    { match: "concealed valve", cls: "chip-round", bx: -107, by: 64, z: 4, w: "64px", h: "61px" },
    { match: "reducing tee", cls: "chip-round", bx: -55, by: 53, z: 4 },
    { match: "male thread", cls: "chip-round", bx: 23, by: 47, z: 4 },
    { match: "double tee", cls: "chip-round", bx: 6, by: 113, z: 4 },
    { match: "single tee", cls: "chip-round", bx: 68, by: 104, z: 4 },
    { match: "coupler", cls: "chip-round", bx: 120, by: 90, z: 4 },
    { match: "bend 45", cls: "chip-round", bx: 146, by: 24, z: 4 },
    { match: "end cap", cls: "chip-round", bx: 177, by: 104, z: 4, w: "64px", h: "61px" },
    { match: "p trap", cls: "chip-round", bx: 198, by: 50, z: 4 },
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
  // CMS-added products the layout doesn't know about: featured items join a
  // back ring, capped so the family shot stays readable on large catalogs.
  const MAX_CHIPS = 24;
  let extra = 0;
  for (const product of products) {
    if (items.length >= MAX_CHIPS) break;
    if (!used.has(product.id) && product.featured) {
      used.add(product.id);
      const ang = (extra / 10) * Math.PI * 2;
      items.push({
        product,
        cls: "chip-round",
        bx: Math.cos(ang) * 235,
        by: -8 + Math.sin(ang) * 44,
        z: 1,
      });
      extra += 1;
    }
  }
  return items;
}

/** Admin-arranged layout wins whenever it exists; missing products are dropped. */
function buildFromSaved(products: Product[], saved: HeroChipLayout): OrbitItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: OrbitItem[] = [];
  for (const chip of saved.chips) {
    const product = byId.get(chip.productId);
    if (!product) continue; // product deleted — skip gracefully
    items.push({
      product,
      cls: chipClassFor(product),
      bx: chip.bx,
      by: chip.by,
      z: chip.z,
      w: chip.w != null ? `${chip.w}px` : undefined,
      h: chip.h != null ? `${chip.h}px` : undefined,
    });
  }
  return items;
}

function isLarge(cls: string) {
  return /chip-(tank|pipe|coil)/.test(cls) && !cls.includes("chip-round");
}

/** Hero product showcase: grouped family shot that scatters into a circle
 * on hover (desktop) or tap (touch), then reassembles. Products and their
 * placement come live from the CMS (Admin → Home group). */
export function ProductShowcase() {
  const { products, heroLayout } = useSiteData();
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => (heroLayout?.chips?.length ? buildFromSaved(products, heroLayout) : buildDefaultSlots(products)),
    [products, heroLayout],
  );

  useEffect(() => {
    const orbit = orbitRef.current;
    const heroVisual = heroRef.current;
    if (!orbit || !heroVisual) return;
    const chips = Array.from(orbit.querySelectorAll<HTMLElement>(".orbit-chip"));

    const scatter = () => {
      const n = chips.length;
      if (!n) return;
      const withAngle = chips.map((chip) => {
        const bx = parseFloat(chip.style.getPropertyValue("--bx")) || 0;
        const by = parseFloat(chip.style.getPropertyValue("--by")) || 0;
        return { chip, baseAngle: (Math.atan2(bx, -by) * 180) / Math.PI };
      });
      withAngle.sort((a, b) => a.baseAngle - b.baseAngle);
      const slot = 360 / n;
      withAngle.forEach((item, i) => {
        const cls = item.chip.dataset.cls ?? "";
        const large = isLarge(cls);
        const jitter = (Math.random() * 2 - 1) * slot * (large ? 0.42 : 0.28);
        const angle = i * slot + jitter;
        const rad = (angle * Math.PI) / 180;
        const dist = large ? 270 + Math.random() * 60 : 150 + Math.random() * 45;
        const sx = Math.sin(rad) * dist;
        const sy = -Math.cos(rad) * dist * 0.85;
        const rot = (Math.random() * 2 - 1) * 55;
        item.chip.style.setProperty("--sx", `${sx.toFixed(1)}px`);
        item.chip.style.setProperty("--sy", `${sy.toFixed(1)}px`);
        item.chip.style.setProperty("--srot", `${rot.toFixed(1)}deg`);
      });
      // resolve overlaps with a few separation passes
      const boxes = withAngle.map((item) => {
        const w = item.chip.offsetWidth || 76;
        const h = item.chip.offsetHeight || 76;
        return {
          chip: item.chip,
          sx: parseFloat(item.chip.style.getPropertyValue("--sx")),
          sy: parseFloat(item.chip.style.getPropertyValue("--sy")),
          r: Math.sqrt(w * w + h * h) / 2,
        };
      });
      const MIN_SEP = 1.05;
      for (let pass = 0; pass < 120; pass++) {
        let moved = false;
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            let dx = b.sx - a.sx;
            let dy = b.sy - a.sy;
            let dist = Math.hypot(dx, dy);
            if (dist < 0.01) {
              dx = 0.01;
              dy = 0.01;
              dist = 0.014;
            }
            const minDist = MIN_SEP * (a.r + b.r);
            if (dist < minDist) {
              moved = true;
              const push = minDist - dist;
              const ux = dx / dist;
              const uy = dy / dist;
              a.sx -= (ux * push) / 2;
              a.sy -= (uy * push) / 2;
              b.sx += (ux * push) / 2;
              b.sy += (uy * push) / 2;
            }
          }
        }
        if (!moved) break;
      }
      boxes.forEach((it) => {
        it.chip.style.setProperty("--sx", `${it.sx.toFixed(1)}px`);
        it.chip.style.setProperty("--sy", `${it.sy.toFixed(1)}px`);
      });
      orbit.classList.add("scattered");
      heroRef.current?.parentElement
        ?.querySelector(".showcase-heading")
        ?.classList.add("scatter-active");
    };
    const reassemble = () => {
      orbit.classList.remove("scattered");
      heroRef.current?.parentElement
        ?.querySelector(".showcase-heading")
        ?.classList.remove("scatter-active");
    };

    let isScattered = false;
    let touchScattered = false;
    let raf = 0;

    const supportsHover = window.matchMedia("(hover: hover)").matches;
    const onMove = (e: MouseEvent) => {
      const rect = heroVisual.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const navEl = document.getElementById("nav");
      const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 0;
      const zoneRadius = Math.min(Math.max(rect.width, rect.height) * 0.95, 320);
      const inside =
        Math.hypot(e.clientX - cx, e.clientY - cy) < zoneRadius && e.clientY > navBottom;
      if (inside && !isScattered) {
        isScattered = true;
        scatter();
      } else if (!inside && isScattered) {
        isScattered = false;
        reassemble();
      }
    };

    const onTouch = () => {
      touchScattered = !touchScattered;
      if (touchScattered) scatter();
      else reassemble();
    };

    if (supportsHover) {
      cancelAnimationFrame(raf);
      // defer until next frame so layout is settled
      raf = requestAnimationFrame(() => document.addEventListener("mousemove", onMove, { passive: true }));
    }
    heroVisual.addEventListener("touchstart", onTouch, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      heroVisual.removeEventListener("touchstart", onTouch);
    };
  }, [items]);

  return (
    <div className="hero-visual-col">
      <div className="showcase-heading" ref={headingRef}>
        <span className="showcase-heading-label">JAGADAMBA PLASTIC</span>
        <span className="showcase-heading-title">Our Range of Products</span>
        <div className="core-note">— just a glimpse, 100+ SKUs in our full catalogue</div>
      </div>
      <div className="hero-visual" ref={heroRef}>
        <div className="showcase-orbit" id="showcaseOrbit" ref={orbitRef}>
          <div className="showcase-pool">
            <div className="glow" />
            <div className="ripple" />
            <div className="ripple r2" />
            <div className="ripple r3" />
          </div>
          <div className="stardust">
            {starPositions.map((s, i) => (
              <span
                key={i}
                style={
                  {
                    left: s.left,
                    top: s.top,
                    animationDelay: `${s.delay}s`,
                    "--tw": s.tw,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          {items.map(({ product, cls, bx, by, z, w, h }) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={`orbit-chip ${cls}`}
              data-cls={cls}
              style={
                {
                  "--bx": `${bx}px`,
                  "--by": `${by}px`,
                  "--z": z,
                  width: w,
                  height: h,
                } as React.CSSProperties
              }
            >
              <div className="chip-disc">
                <img src={product.image} alt={product.name} loading="lazy" />
              </div>
              <span className="chip-label">{product.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
