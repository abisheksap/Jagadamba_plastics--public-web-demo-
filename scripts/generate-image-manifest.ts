// Regenerate src/data/imageManifest.ts with the current /public/images contents.
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const files: string[] = [];
function walk(dir: string) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(e.name)) files.push("/" + p);
  }
}
walk("public/images");
files.sort();
writeFileSync(
  "src/data/imageManifest.ts",
  `// AUTO-GENERATED — regenerate with: bun scripts/generate-image-manifest.ts\n\n` +
    `export const IMAGE_MANIFEST: string[] = ${JSON.stringify(files, null, 2)};\n`,
);
console.log("imageManifest.ts:", files.length, "files");

