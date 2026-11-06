import asyncio, re
import sys
from pathlib import Path
from playwright.async_api import async_playwright
sys.path.insert(0, str(Path(__file__).parent))
from common import BASE, ROOT, launch
PASS=FAIL=0
def check(cond, msg):
    global PASS, FAIL
    if cond: PASS+=1; print("  PASS", msg)
    else: FAIL+=1; print("  FAIL", msg)
async def main():
    async with async_playwright() as p:
        b=await launch(p)
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        reqs=[]; pg.on("request", lambda r: reqs.append(r.url))
        def seen(pat): return [u for u in reqs if re.search(pat,u)]
        await pg.goto(BASE+"/",wait_until="load"); await pg.wait_for_timeout(1200)
        print("FIRST LOAD (home, top of page)")
        for name in ["AdminApp","About-","Contact-","Gallery-","Reviews-","Products-","ProcessJourney","DocumentsSection","CompanyAssistant"]:
            check(not seen(name+r".*\.js"), f"{name.strip('-')} code NOT downloaded")
        check(not seen(r"admin-dashboard|AdminApp.*\.css"), "admin stylesheet NOT downloaded")
        before=len(seen(r"/images/"))
        print("  info: image requests on first load:", before)
        # chat assistant arrives after idle/interaction
        await pg.wait_for_timeout(3600)
        check(bool(seen(r"CompanyAssistant.*\.js")), "chat widget code loads once the page is idle")
        # scrolling brings in lazy sections and images
        imgs_top=len(seen(r"/images/products-v2|/images/orbit|/images/gallery"))
        for y in range(0,9000,500):
            await pg.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})"); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(1200)
        check(bool(seen(r"ProcessJourney.*\.js")), "process section code loads when scrolled near")
        check(bool(seen(r"DocumentsSection.*\.js")), "documents section code loads when scrolled near")
        check(len(seen(r"/images/"))>before, f"below-the-fold images load as you scroll ({before} -> {len(seen(chr(47)+'images'+chr(47)))})")
        n=await pg.evaluate("[...document.images].filter(i=>i.loading==='lazy').length")
        check(n>=10, f"{n} images on the home page are marked loading=lazy")
        # route-level chunks
        await pg.click("a[href='/about']"); await pg.wait_for_timeout(1500)
        check(bool(seen(r"About-.*\.js")), "About chunk downloads only when About is opened")
        check(not seen(r"Contact-.*\.js"), "Contact chunk still not downloaded")
        check(not seen(r"AdminApp.*\.js"), "admin still not downloaded for visitors")
        # admin chunk only on /admin
        await pg.goto(BASE+"/admin",wait_until="load"); await pg.wait_for_timeout(1500)
        check(bool(seen(r"AdminApp.*\.js")), "admin chunk downloads only when /admin is opened")
        # image attributes in the DOM
        await pg.goto(BASE+"/products",wait_until="load"); await pg.wait_for_timeout(2500)
        info=await pg.evaluate("(()=>{const l=[...document.images];return {total:l.length,lazy:l.filter(i=>i.loading==='lazy').length,async:l.filter(i=>i.decoding==='async').length}})()")
        check(info['lazy']>=info['total']*0.6, f"products page: {info['lazy']}/{info['total']} images lazy, {info['async']} decode async")
        print(f"\nRESULT: {PASS} passed, {FAIL} failed")
        await b.close()
asyncio.run(main())
sys.exit(1 if FAIL else 0)
