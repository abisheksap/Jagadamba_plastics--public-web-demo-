import asyncio, http.server, os, re, subprocess, threading
import sys
from pathlib import Path
from playwright.async_api import async_playwright
sys.path.insert(0, str(Path(__file__).parent))
from common import BASE, ROOT, launch
PASS=FAIL=0
def check(cond,msg):
    global PASS,FAIL
    if cond: PASS+=1; print("  PASS",msg)
    else: FAIL+=1; print("  FAIL",msg)
async def main():
    out = ROOT / ".tmp-dist-convex"
    env = dict(os.environ, VITE_CONVEX_URL="https://unreachable-test.convex.cloud")
    subprocess.run(["npx", "vite", "build", "--outDir", str(out), "--emptyOutDir"], cwd=ROOT, env=env, check=True, capture_output=True)

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(out), **k)

        def translate_path(self, path):
            p = super().translate_path(path)
            return p if os.path.isfile(p) else str(out / "index.html")

        def log_message(self, *a):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 4181), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b=await launch(p)
        pg=await (await b.new_context(viewport={"width":1440,"height":900})).new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        print("CONVEX-CONNECTED BUILD, BACKEND UNREACHABLE (builds its own copy)")
        await pg.goto("http://127.0.0.1:4181/",wait_until="load"); await pg.wait_for_timeout(3500)
        check(await pg.locator(".data-gate").count()==1,"visitors see a loader while data is loading (no empty grids)")
        check(await pg.locator(".p-card-future, .product-atlas").count()==0,"no half-empty page content is shown")
        check(await pg.locator(".data-gate-slow").count()==0,"no error message yet (fewer than 8 seconds)")
        await pg.wait_for_timeout(6500)
        check(await pg.locator(".data-gate-slow").count()==1,"after 8 seconds it says it is taking longer and offers 'Try again'")
        check(await pg.locator(".error-screen").count()==0,"the app does not crash")
        await pg.goto("http://127.0.0.1:4181/admin",wait_until="load"); await pg.wait_for_timeout(2500)
        body=await pg.inner_text("body")
        check(await pg.locator("#passcode").count()==1 and await pg.locator("#passcode-confirm").count()==0,"admin shows a normal sign-in form (no local setup in production mode)")
        check("create a passcode" not in body.lower() and not re.search("jagadamba2077|default passcode",body,re.I),"no 'create passcode' flow and no default password or hint")
        await pg.fill("#passcode","some-guess-12345"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(14500)
        err=await pg.inner_text(".login-error")
        check(len(err)>0 and "passcode" not in err.lower().replace("incorrect passcode",""),f"an unreachable server gives a clear message, not a crash ('{err[:60]}')")
        check(await pg.evaluate("sessionStorage.getItem('jagadamba-admin-token')")is None,"no session is created")
        check(not [e for e in errs if "Unauthorized" in e],"no uncaught errors")
        print(f"\nRESULT: {PASS} passed, {FAIL} failed")
        server.shutdown(); await b.close()
        import shutil; shutil.rmtree(out, ignore_errors=True)
asyncio.run(main())
sys.exit(1 if FAIL else 0)
