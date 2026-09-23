// Post-build step: copy the SPA entry to 404.html so static hosts that use a
// 404 fallback still serve the React router on deep links like /products/:id.
import { copyFileSync, existsSync } from "node:fs";

if (existsSync("dist/index.html")) {
  copyFileSync("dist/index.html", "dist/404.html");
  console.log("copied dist/index.html -> dist/404.html (SPA fallback)");
}
