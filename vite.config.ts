import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.PORT) || 5173;

// The public address of the website (no trailing slash). Set VITE_SITE_URL when you build for your real domain.
const siteUrl = (process.env.VITE_SITE_URL || "https://jagadamba-plastics-public-web-demo.vercel.app").replace(/\/+$/, "");

const PUBLIC_PAGES = ["/", "/about", "/products", "/gallery", "/reviews", "/contact"];

/** Fills in the site address in index.html and writes robots.txt and sitemap.xml for it. */
function siteMeta() {
  return {
    name: "jagadamba-site-meta",
    transformIndexHtml: (html: string) => html.replaceAll("__SITE_URL__", siteUrl),
    generateBundle(this: { emitFile: (f: { type: "asset"; fileName: string; source: string }) => void }) {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      const urls = PUBLIC_PAGES.map(
        (p) => `  <url><loc>${siteUrl}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod></url>`,
      ).join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), siteMeta()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        // long-lived vendor files are cached by the browser across deployments of the site's own code
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          convex: ["convex/react", "convex/browser"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port,
  },
  preview: {
    host: "0.0.0.0",
    port,
  },
});
