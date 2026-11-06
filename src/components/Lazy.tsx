import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/** Shown while a lazily loaded page or panel downloads. Small, accessible and layout-stable. */
export function PageLoader({ label = "Loading", minHeight = "60vh" }: { label?: string; minHeight?: string }) {
  return (
    <div className="page-loader" style={{ minHeight } as CSSProperties} role="status" aria-live="polite" aria-busy="true">
      <span className="page-loader-mark" aria-hidden="true">
        <i /><i /><i />
      </span>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/**
 * Renders `children` (typically a React.lazy component) only once the placeholder is near the viewport,
 * so below-the-fold sections add nothing to the first load: no JavaScript, no images, no DOM.
 * The placeholder reserves `minHeight` and keeps the section's `id`, so "#section" links still work.
 */
export function LazyOnView({
  children,
  id,
  minHeight,
  className,
  rootMargin = "700px 0px",
}: {
  children: ReactNode;
  id?: string;
  /** Fixed placeholder height in px. Prefer `className` with a responsive min-height so the swap causes no layout shift. */
  minHeight?: number;
  className?: string;
  rootMargin?: string;
}) {
  const style = minHeight ? { minHeight } : undefined;
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [show, rootMargin]);

  if (!show) return <div ref={ref} id={id} className={className} style={style} aria-hidden="true" />;
  return <Suspense fallback={<div id={id} className={className} style={style} aria-hidden="true" />}>{children}</Suspense>;
}

/**
 * True once the page has had `minDelayMs` to paint and the browser is idle, or as soon as the visitor
 * interacts (whichever comes first). Used for things that are not needed for the first paint, like the chat widget.
 */
export function useIdle(minDelayMs = 1500, timeoutMs = 4000): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const done = () => setIdle(true);
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const timer = window.setTimeout(() => (ric ? ric(done, { timeout: timeoutMs }) : done()), minDelayMs);
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, done, { once: true, passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, done));
    };
  }, [minDelayMs, timeoutMs]);
  return idle;
}
