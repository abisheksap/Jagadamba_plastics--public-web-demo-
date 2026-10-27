import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, PointerEvent } from "react";
import { Link } from "react-router-dom";
import { useSiteData } from "../data/SiteDataProvider";
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
  const [lockedMode, setLockedMode] = useState<LayoutMode | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const reducedMotion = useReducedMotion();
  const motion = useMemo(() => normalizeShowcaseMotion(heroLayout?.motion), [heroLayout?.motion]);
  const items = useMemo(() => resolveShowcaseItems(products, heroLayout), [heroLayout, products]);
  const scatter = useMemo(() => buildScatterPlacements(items, motion), [items, motion]);
  const layoutMode: LayoutMode = lockedMode ?? (hovered || focusWithin ? "scattered" : "grouped");
  const hasSavedLayout = heroLayout !== undefined;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fitStage = () => {
      const scale = Math.min(1, Math.max(0.2, viewport.clientWidth / SHOWCASE_STAGE.width));
      viewport.style.setProperty("--showcase-scale", scale.toFixed(4));
      viewport.style.setProperty("--showcase-height", `${Math.ceil(SHOWCASE_STAGE.height * scale)}px`);
    };
    fitStage();
    const observer = new ResizeObserver(fitStage);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

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

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (lockedMode === null && event.pointerType !== "touch" && window.matchMedia("(hover: hover)").matches) setHovered(true);
  };
  const onPointerLeave = () => setHovered(false);
  const onFocus = () => {
    if (lockedMode === null) setFocusWithin(true);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
  };

  return (
    <div className="hero-visual-col showcase-component">
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
        <div className="showcase-mode-switch" role="group" aria-label="Product arrangement mode">
          <button type="button" className={lockedMode === null ? "active" : ""} aria-pressed={lockedMode === null} onClick={() => setLockedMode(null)}>
            Hover
          </button>
          <button type="button" className={lockedMode === "grouped" ? "active" : ""} aria-pressed={lockedMode === "grouped"} onClick={() => setLockedMode("grouped")}>
            Grouped
          </button>
          <button type="button" className={lockedMode === "scattered" ? "active" : ""} aria-pressed={lockedMode === "scattered"} onClick={() => setLockedMode("scattered")}>
            Scattered
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="hero-visual showcase-viewport"
        data-layout-source={hasSavedLayout ? "admin" : "default"}
        data-layout-mode={layoutMode}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocusCapture={onFocus}
        onBlurCapture={onBlur}
      >
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
                  <span className="chip-disc"><img src={item.product.image} alt="" loading="lazy" /></span>
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
