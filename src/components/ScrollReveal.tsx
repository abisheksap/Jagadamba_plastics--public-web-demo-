import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll-in animations for the public pages.
 *
 * Section content below the fold fades and rises into place the first time it scrolls into view.
 * - Content that is already on screen is never hidden, so there is no flash on load.
 * - Nothing is hidden until this code runs (no JavaScript = everything visible).
 * - With "reduce motion" turned on, nothing is animated at all.
 * - Anything the visitor scrolls past (End key, scrollbar drag, anchor links) is shown straight away.
 * - Once an element has appeared its reveal styles are removed, so hover effects work normally.
 */
const BLOCKS = [
  "main section:not(.hero):not(.page-hero) > .wrap > *",
  "main .wrap > [class*='grid'] > *",
  "main .serve-list > *",
  "main .documents-grid > li",
  "main .process-journey-stages > *",
  "main .stat-cards-future > *",
  "main .story-support-strip > *",
  "main .timeline > *",
  "main .cert-row-future > *",
  "main .dealer-results > *",
].join(",");

const STAGGER_MAX = 6;
const STAGGER_MS = 70;

export function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const pending = new Set<HTMLElement>();

    const reveal = (el: HTMLElement, instant = false) => {
      if (!pending.delete(el)) return;
      observer.unobserve(el);
      if (instant) el.style.transition = "none"; // already scrolled past: show it without animating
      el.classList.add("is-revealed");
      const delay = instant ? 0 : parseInt(el.style.getPropertyValue("--reveal-delay") || "0", 10) || 0;
      // after the animation, drop the reveal styles so the element's own hover transitions return
      window.setTimeout(() => {
        el.removeAttribute("data-reveal");
        el.classList.remove("is-revealed");
        el.style.removeProperty("--reveal-delay");
        el.style.removeProperty("transition");
      }, delay + (instant ? 60 : 1100));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    // The observer never fires for elements that are jumped over completely, so sweep them up.
    let sweepTimer = 0;
    const sweep = () => {
      pending.forEach((el) => {
        if (el.getBoundingClientRect().bottom < 0) reveal(el, true);
      });
    };
    const onScroll = () => {
      window.clearTimeout(sweepTimer);
      sweepTimer = window.setTimeout(sweep, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tag = () => {
      const fold = window.innerHeight * 0.92;
      const seen = new Map<Element, number>();
      document.querySelectorAll<HTMLElement>(BLOCKS).forEach((el) => {
        if (el.dataset.revealSeen) return;
        el.dataset.revealSeen = "1";
        if (el.getBoundingClientRect().top < fold) return; // already on screen: leave visible
        const parent = el.parentElement as Element;
        const index = seen.get(parent) ?? 0;
        seen.set(parent, index + 1);
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--reveal-delay", `${Math.min(index, STAGGER_MAX) * STAGGER_MS}ms`);
        pending.add(el);
        observer.observe(el);
      });
      root.classList.add("reveal-ready");
    };

    tag();
    let timer = 0;
    const watcher = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(tag, 120); // pages, lazy sections and data arrive after first render
    });
    const main = document.getElementById("main");
    if (main) watcher.observe(main, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(sweepTimer);
      window.removeEventListener("scroll", onScroll);
      watcher.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
