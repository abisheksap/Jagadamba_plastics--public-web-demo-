import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./catalog.css";
import "./public-motion.css";
import "./arranger.css";
import "./process-journey.css";
import "./message-action.css";
import "./theme-ideas.css";
import "./styles/animations.css";
import "./refresh.css";
import "./sections.css";
import "./polish.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/** Fade out the logo loading animation from index.html once the app is mounted and the page has loaded. */
function hideBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) {
    document.documentElement.classList.add("splash-done");
    return;
  }
  const quick = splash.classList.contains("is-quick") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minMs = quick ? 450 : 2300; // first visit: let the ring, letters and flame finish
  const started = (window as unknown as { __bootStart?: number }).__bootStart ?? 0;
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 4000));
  void Promise.race([Promise.all([loaded, fonts]).then(() => undefined), timeout]).then(() => {
    const wait = Math.max(0, minMs - (performance.now() - started));
    window.setTimeout(() => {
      splash.classList.add("is-done");
      document.documentElement.classList.add("splash-done"); // header logo starts its own animation now
      window.setTimeout(() => splash.remove(), 900);
    }, wait);
  });
}
hideBootSplash();
