"""Serves dist/ with the exact security headers from dist/_headers and checks the site runs without
Content-Security-Policy violations (pages, search, chat widget, quote list)."""
import asyncio
import http.server
import os
import sys
import threading
from pathlib import Path

from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).parent))
from common import ROOT, launch

DIST = str(ROOT / "dist")
PORT = 4180
block = [b for b in open(DIST + "/_headers").read().split("\n\n") if "Content-Security-Policy" in b][0]
HEADERS = [tuple(l.strip().split(": ", 1)) for l in block.splitlines() if l.startswith("  ") and ": " in l]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)

    def translate_path(self, path):
        p = super().translate_path(path)
        return p if os.path.isfile(p) else os.path.join(DIST, "index.html")

    def end_headers(self):
        for k, v in HEADERS:
            self.send_header(k, v)
        super().end_headers()

    def log_message(self, *a):
        pass


async def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await launch(p)
        pg = await (await b.new_context(viewport={"width": 1440, "height": 900})).new_page()
        viol, errs = [], []
        await pg.add_init_script("window.__v=[];document.addEventListener('securitypolicyviolation',e=>window.__v.push(e.violatedDirective+' '+e.blockedURI))")
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Content Security Policy" in m.text else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
        base = f"http://127.0.0.1:{PORT}"
        r = await pg.goto(base + "/", wait_until="load")
        applied = "content-security-policy" in r.headers
        print("  policy is applied by the server:", applied)
        await pg.wait_for_timeout(4500)
        for path in ["/about", "/products", "/products/pvc-pipe-ns", "/gallery", "/reviews", "/contact", "/admin", "/nope-404"]:
            await pg.goto(base + path, wait_until="load")
            await pg.wait_for_timeout(1400)
            viol += await pg.evaluate("window.__v")
        await pg.goto(base + "/", wait_until="load")
        await pg.wait_for_timeout(4000)
        await pg.click(".sx-search")
        await pg.fill(".sx-search-panel input", "pipe")
        await pg.wait_for_timeout(500)
        await pg.keyboard.press("Escape")
        await pg.click(".assistant-trigger")
        await pg.fill(".assistant-compose input", "price of tank")
        await pg.keyboard.press("Enter")
        await pg.wait_for_timeout(1200)
        await pg.goto(base + "/products/pvc-pipe-ns", wait_until="load")
        await pg.wait_for_timeout(1500)
        await pg.click("text=Add to quote")
        await pg.wait_for_timeout(400)
        viol += await pg.evaluate("window.__v")
        print("  CSP violations:", viol or "none")
        print("  CSP console errors:", errs or "none")
        ok = applied and not viol and not errs
        global RESULT_OK
        RESULT_OK = ok
        print("RESULT: 1 passed, 0 failed" if ok else "RESULT: 0 passed, 1 failed")
        await b.close()
    server.shutdown()


RESULT_OK = False
asyncio.run(main())
sys.exit(0 if RESULT_OK else 1)
