import { useEffect, useRef } from "react";

/**
 * Applies the prototype's staggered reveal-on-scroll to every direct child of
 * the returned ref (cards start hidden, then fade/slide in sequence when the
 * group enters the viewport). Re-runs when `deps` change so dynamically
 * filtered product grids reveal correctly.
 */
export function useRevealOnScroll<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const parent = ref.current;
    if (!parent) return;
    const children = Array.from(parent.children) as HTMLElement[];
    children.forEach((child) => child.classList.remove("in"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = children.indexOf(entry.target as HTMLElement);
          setTimeout(() => entry.target.classList.add("in"), Math.max(0, idx) * 90);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );
    children.forEach((child) => io.observe(child));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
