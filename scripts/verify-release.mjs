// Release checks for the production build (run after `npm run build`):  npm run verify
// Fails (exit code 1) if the build leaks a secret, ships the admin panel to every visitor,
// misses a hosting file, or has an unsafe security policy.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
let failures = 0;
const ok = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  \u2717 ${msg}`);
};
const check = (cond, pass, fail_) => (cond ? ok(pass) : fail(fail_ ?? pass));
const section = (title) => console.log(`\n${title}`);

if (!existsSync(join(DIST, "index.html"))) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(DIST);
const normalizedFiles = files.map((file) => file.replaceAll("\\", "/"));
const text = (p) => readFileSync(p, "utf8");
const textFiles = files.filter((f) => /\.(js|css|html|json|txt|xml)$/.test(f));
const html = text(join(DIST, "index.html"));

section("Secrets and admin access");
const banned = [/jagadamba2077/i, /default passcode/i, /DEFAULT_PASSCODE/, /ADMIN_PASSCODE\s*[:=]\s*["'][^"']{6,}/];
const leaks = textFiles.filter((f) => banned.some((re) => re.test(text(f))));
check(leaks.length === 0, "no default or hard-coded passcode anywhere in the build", `passcode text found in: ${leaks.join(", ")}`);
check(!/\.env(\.|$)/.test(files.join("\n")), "no .env file is published");
check(!files.some((f) => f.endsWith(".map")), "no source maps are published");

const srcLeaks = walk("src")
  .filter((f) => /\.(ts|tsx|css)$/.test(f))
  .filter((f) => /jagadamba2077|Default passcode/i.test(text(f)));
check(srcLeaks.length === 0, "no default passcode text in the source code", `found in: ${srcLeaks.join(", ")}`);
for (const envFile of [".env", ".env.local", ".env.production"]) {
  if (existsSync(envFile)) fail(`${envFile} exists in the project folder: make sure it is NOT committed`);
}

section("Lazy loading");
const entryNames = new Set([...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]));
const entryText = [...entryNames].map((n) => text(join(DIST, "assets", n))).join("\n");
check(!entryText.includes("NEW PASSCODE"), "the admin login and screens are not in the first-load JavaScript");
check(!/Jagadamba Admin/.test(entryText), "the admin panel code is a separate, lazily loaded chunk");
const jsChunks = normalizedFiles.filter((file) => /assets\/.+\.js$/.test(file));
check(jsChunks.length >= 12, `the site is split into ${jsChunks.length} JavaScript chunks`, `only ${jsChunks.length} chunks: code splitting is not working`);
const firstLoadGz = [...entryNames].reduce((n, name) => n + gzipSync(readFileSync(join(DIST, "assets", name))).length, 0);
const budgetKb = 260;
check(firstLoadGz / 1024 <= budgetKb, `first-load JavaScript is ${(firstLoadGz / 1024).toFixed(0)} KB gzipped (budget ${budgetKb} KB)`, `first-load JavaScript is ${(firstLoadGz / 1024).toFixed(0)} KB gzipped: over the ${budgetKb} KB budget`);

section("Security headers and policy");
const headersFile = existsSync(join(DIST, "_headers")) ? text(join(DIST, "_headers")) : "";
const vercel = existsSync("vercel.json") ? text("vercel.json") : "";
const netlify = existsSync("netlify.toml") ? text("netlify.toml") : "";
check(/Content-Security-Policy/.test(headersFile), "_headers carries a Content-Security-Policy");
check(/Content-Security-Policy/.test(vercel) && /Content-Security-Policy/.test(netlify), "vercel.json and netlify.toml carry it too");
const scriptSrc = (headersFile.match(/script-src ([^;]+);/) || [])[1] || "";
check(scriptSrc.length > 0 && !/unsafe-inline|unsafe-eval/.test(scriptSrc), `script-src is strict (${scriptSrc.trim()})`);
const scriptTags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
const inlineScripts = scriptTags.filter((tag) => !/\bsrc=/.test(tag) && !/type="application\/ld\+json"/.test(tag));
check(inlineScripts.length === 0, "index.html has no inline scripts (compatible with the strict policy)", `inline script found: ${inlineScripts[0]}`);
try {
  JSON.parse(vercel);
  ok("vercel.json is valid JSON");
} catch {
  fail("vercel.json is not valid JSON");
}
check(/X-Frame-Options/.test(headersFile) && /nosniff/.test(headersFile) && /Strict-Transport-Security/.test(headersFile), "clickjacking, MIME-sniffing and HTTPS headers are set");

section("Search engines and hosting");
const robots = existsSync(join(DIST, "robots.txt")) ? text(join(DIST, "robots.txt")) : "";
check(/Disallow: \/admin/.test(robots) && /Sitemap:/.test(robots), "robots.txt hides /admin and lists the sitemap");
check(existsSync(join(DIST, "sitemap.xml")) && /<loc>/.test(text(join(DIST, "sitemap.xml"))), "sitemap.xml is generated");
check(!html.includes("__SITE_URL__"), "the site address was filled in (canonical and social-preview links)");
check(/<link rel="canonical" href="https?:\/\//.test(html), "canonical link is an absolute address");
check(/property="og:image" content="https?:\/\//.test(html), "social preview image uses an absolute address");
check(existsSync(join(DIST, "_redirects")) && existsSync(join(DIST, "404.html")), "single-page-app fallback files are present");
check(/\/admin\*/.test(headersFile) && /noindex/.test(headersFile), "the admin area is served with noindex");

console.log(failures === 0 ? "\nAll release checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
