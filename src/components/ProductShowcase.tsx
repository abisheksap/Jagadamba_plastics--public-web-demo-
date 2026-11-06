import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useSiteData } from "../data/SiteDataProvider";
import { PRODUCT_GROUPS } from "../data/types";
import {
  SHOWCASE_STAGE,
  buildScatterPlacements,
  interpolatePlacement,
  normalizeShowcaseMotion,
  resolveShowcaseItems,
} from "./showcaseLayout";
import "./showcase.css";

type LayoutMode = "grouped" | "scattered";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function ProductShowcase() {
  const { products, heroLayout } = useSiteData();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const [motionProgress, setMotionProgress] = useState(0);
  // Hover (or keyboard focus) scatters the products; moving away regroups them.
  const [engaged, setEngaged] = useState(false);
  const leaveTimer = useRef<number | undefined>(undefined);
  const engage = () => { window.clearTimeout(leaveTimer.current); setEngaged(true); };
  const disengage = () => { window.clearTimeout(leaveTimer.current); leaveTimer.current = window.setTimeout(() => setEngaged(false), 140); };
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 880px)").matches);
  const reducedMotion = useReducedMotion();
  const motion = useMemo(() => normalizeShowcaseMotion(heroLayout?.motion), [heroLayout?.motion]);
  const items = useMemo(() => resolveShowcaseItems(products, heroLayout), [heroLayout, products]);
  const scatter = useMemo(() => buildScatterPlacements(items, motion), [items, motion]);
  const layoutMode: LayoutMode = engaged ? "scattered" : "grouped";
  const hasSavedLayout = heroLayout !== undefined;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 880px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Grouped view: zoom the stage onto the product cluster so it fills its panel
  // (saved layout coordinates are untouched). Scattered view: show the whole stage.
  // The cluster box is measured from the rendered images at scale 1, so it matches what visitors see.
  const clusterRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || isMobile) return;
    const stage = viewport.querySelector<HTMLElement>(".showcase-stage");

    const measureCluster = () => {
      if (!stage || layoutMode === "scattered" || progressRef.current > 0.001) return;
      const images = stage.querySelectorAll<HTMLElement>(".orbit-chip img");
      if (!images.length) { clusterRef.current = null; return; }
      const previousTransition = stage.style.transition;
      stage.style.transition = "none";
      stage.style.transform = "translateX(-50%)";
      const orbit = stage.querySelector<HTMLElement>(".showcase-orbit");
      const origin = (orbit ?? stage).getBoundingClientRect(); // relative to the orbit, so its entrance animation cannot skew the result
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      images.forEach((img) => {
        const r = img.getBoundingClientRect();
        minX = Math.min(minX, r.left - origin.left);
        maxX = Math.max(maxX, r.right - origin.left);
        minY = Math.min(minY, r.top - origin.top);
        maxY = Math.max(maxY, r.bottom - origin.top);
      });
      stage.style.transform = "";
      stage.style.transition = previousTransition;
      if (Number.isFinite(minX)) clusterRef.current = { minX, maxX, minY, maxY };
    };

    const fitStage = () => {
      const width = viewport.clientWidth;
      const fullScale = Math.min(1, Math.max(0.2, width / SHOWCASE_STAGE.width));
      const fullHeight = SHOWCASE_STAGE.height * fullScale;
      const box = clusterRef.current;
      const pad = 40;
      let groupedScale = fullScale;
      let groupedHeight = fullHeight;
      if (box) {
        groupedScale = Math.min(1.35, Math.max(0.2, width / (box.maxX - box.minX + pad * 2)));
        groupedHeight = (box.maxY - box.minY + pad * 2) * groupedScale;
      }
      // the panel keeps one height in both modes so it never resizes under the pointer (no hover flicker)
      const height = Math.max(groupedHeight, fullHeight);
      // scattered ring is roughly 540 stage-units wide, so it can be shown larger than the full-stage scale
      let scale = Math.min(1.15, Math.max(fullScale, width / 600));
      let shiftX = 0;
      let shiftY = height / 2 - SHOWCASE_STAGE.anchorY * scale;
      if (layoutMode !== "scattered" && box) {
        scale = groupedScale;
        shiftX = -((box.minX + box.maxX) / 2 - SHOWCASE_STAGE.width / 2) * scale;
        shiftY = height / 2 - ((box.minY + box.maxY) / 2) * scale;
      }
      viewport.style.setProperty("--showcase-scale", scale.toFixed(4));
      viewport.style.setProperty("--showcase-height", `${Math.ceil(height)}px`);
      viewport.style.setProperty("--showcase-shift-x", `${shiftX.toFixed(1)}px`);
      viewport.style.setProperty("--showcase-shift-y", `${shiftY.toFixed(1)}px`);
    };

    // wait a frame so chip images have their layout before measuring
    const frame = requestAnimationFrame(() => { measureCluster(); fitStage(); });
    const observer = new ResizeObserver(fitStage);
    observer.observe(viewport);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [isMobile, layoutMode, items]);

  useEffect(() => {
    const target = layoutMode === "scattered" ? 1 : 0;
    if (reducedMotion) {
      progressRef.current = target;
      setMotionProgress(target);
      return;
    }
    const start = progressRef.current;
    if (Math.abs(start - target) < 0.001) return;
    const startedAt = performance.now();
    const duration = Math.max(80, motion.durationMs * Math.abs(target - start));
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = elapsed < 0.5 ? 4 * elapsed ** 3 : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;
      const next = start + (target - start) * eased;
      progressRef.current = next;
      setMotionProgress(next);
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [layoutMode, motion.durationMs, reducedMotion]);

  return (
    <div
      className={`hero-visual-col showcase-component${engaged ? " is-engaged" : ""}`}
      onPointerEnter={(e) => { if (e.pointerType !== "touch") engage(); }}
      onPointerLeave={(e) => { if (e.pointerType !== "touch") disengage(); }}
      onFocusCapture={engage}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) disengage(); }}
    >
      <div className={`showcase-heading ${layoutMode === "scattered" ? "scatter-active" : ""}`}>
        <span className="showcase-heading-label">JAGADAMBA PLASTIC</span>
        <span className="showcase-heading-title">Our Range of Products</span>
        <div className="core-note" aria-live="polite">
          {items.length === 0
            ? "No products are currently selected for this group"
            : hasSavedLayout
              ? `${items.length} products · arrangement saved from the homepage designer`
              : `${items.length} products from our complete range`}
        </div>
      </div>
      <div
        ref={viewportRef}
        className="hero-visual showcase-viewport"
        data-layout-source={hasSavedLayout ? "admin" : "default"}
        data-layout-mode={layoutMode}
      >
        <nav className="showcase-mobile-grid" aria-label="Browse product families">
          {PRODUCT_GROUPS.map((group) => {
            const product = products.find((item) => group.categories.includes(item.category));
            return <Link key={group.id} to={`/products?group=${group.id}`} className="showcase-family-card">
              {product && <img src={product.image} alt="" loading="lazy" />}
              <span>{group.label}</span>
              <small>{group.eyebrow}</small>
            </Link>;
          })}
        </nav>
        <div className="showcase-stage">
          <div className={`showcase-orbit ${layoutMode}`} id="showcaseOrbit" aria-label={`${items.length} products in ${layoutMode} view`}>
            <div className="showcase-pool" aria-hidden="true"><div className="glow" /><div className="ripple" /><div className="ripple r2" /><div className="ripple r3" /></div>
            {items.map((item) => {
              const placement = interpolatePlacement(item, scatter.get(item.productId), motionProgress);
              const style = {
                "--tx": `${placement.x}px`,
                "--ty": `${placement.y}px`,
                "--rot": `${placement.rotation}deg`,
                "--chip-scale": 1 - motionProgress * 0.1,
                "--z": item.z,
                ...(item.w !== undefined ? { width: `${item.w}px` } : {}),
                ...(item.h !== undefined ? { height: `${item.h}px` } : {}),
              } as CSSProperties;
              return (
                <Link key={item.productId} to={`/products/${item.productId}`} className={`orbit-chip ${item.className}`} style={style} aria-label={`View ${item.product.name}`}>
                  <span className="chip-disc"><img src={item.product.image} alt="" loading="eager" decoding="async" /></span>
                  <span className="chip-label">{item.product.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
