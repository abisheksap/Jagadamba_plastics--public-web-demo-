import asyncio, subprocess, time, re, urllib.request
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
SECRET="a-valid-passcode-123"
LEAK=re.compile(r"jagadamba2077|default passcode",re.I)
async def storage_dump(pg):
    return await pg.evaluate("JSON.stringify({l:{...localStorage},s:{...sessionStorage}})")
async def main():
    async with async_playwright() as p:
        b=await launch(p)
        # ---------------- production build (no backend configured) ----------------
        print("PRODUCTION BUILD (needs `npm run build` + `npm run preview`)")
        pg=await (await b.new_context(viewport={"width":1440,"height":900})).new_page()
        src=urllib.request.urlopen(BASE+"/").read().decode()
        check(not LEAK.search(src),"the page's HTML source contains no default password or hint")
        await pg.goto(BASE+"/admin",wait_until="load"); await pg.wait_for_timeout(1500)
        body=await pg.inner_text("body")
        check(not LEAK.search(body),"the login page shows no default password or 'default passcode' hint")
        check(await pg.locator("input[type=password]").count()==0,"with no backend there is no password box at all (fails closed)")
        check("not available" in body.lower(),"it explains that admin needs a backend connection")
        check(await pg.evaluate("document.querySelector('meta[name=robots][content*=noindex]')!==null"),"the admin area is marked noindex")
        await pg.goto(BASE+"/admin/settings",wait_until="load"); await pg.wait_for_timeout(1200)
        check(await pg.locator("#pw-cur").count()==0,"admin sub-pages are gated too (no settings form without sign-in)")
        # every shipped JS/CSS file is free of the old default
        html=urllib.request.urlopen(BASE+"/").read().decode()
        assets=set(re.findall(r'/assets/[^"\']+\.(?:js|css)',html))
        allbad=[]
        for a in assets:
            if LEAK.search(urllib.request.urlopen(BASE+a).read().decode("utf8","ignore")): allbad.append(a)
        check(not allbad,f"none of the {len(assets)} first-load files contain a default password")
        await pg.context.close()
        # ---------------- local development flow ----------------
        print("LOCAL DEVELOPMENT FLOW (vite dev)")
        srv=subprocess.Popen(f"cd {ROOT} && npx vite --port 5175 --host 127.0.0.1",shell=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        time.sleep(7)
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        await pg.goto("http://127.0.0.1:5175/admin",wait_until="load"); await pg.wait_for_selector("input[type=password]",timeout=15000)
        body=await pg.inner_text("body")
        check("create a passcode" in body.lower(),"first visit asks you to CREATE a passcode (there is no default one)")
        check(not LEAK.search(body),"no default password or hint on the page")
        await pg.fill("#passcode","short"); await pg.fill("#passcode-confirm","short"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
        check("at least 12" in (await pg.inner_text(".login-error")).lower(),"a short passcode is rejected")
        await pg.fill("#passcode",SECRET); await pg.fill("#passcode-confirm","different-value-xx"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
        check("do not match" in (await pg.inner_text(".login-error")).lower(),"mismatched confirmation is rejected")
        await pg.fill("#passcode",SECRET); await pg.fill("#passcode-confirm",SECRET); await pg.click("button[type=submit]"); await pg.wait_for_timeout(2500)
        check(await pg.locator("h1:has-text('Dashboard')").count()>0 or "/admin" in pg.url and await pg.locator("input[type=password]").count()==0,"creating a passcode signs you in")
        dump=await storage_dump(pg)
        check(SECRET not in dump,"the passcode is not stored anywhere in the browser in plain text")
        tok=await pg.evaluate("sessionStorage.getItem('jagadamba-admin-token')")
        check(tok=="local-dev","the session holds only a token, never the passcode")
        stored=await pg.evaluate("localStorage.getItem('jagadamba-dev-admin-passcode')")
        check(stored is not None and '"salt"' in stored and '"hash"' in stored and SECRET not in stored,"local dev keeps only a salted hash")
        check(not LEAK.search(await pg.content()),"signed-in admin HTML has no default password text")
        await pg.reload(wait_until="load"); await pg.wait_for_timeout(2500)
        check(await pg.locator("input[type=password]").count()==0,"a reload keeps you signed in for the session")
        await pg.click("text=Sign out"); await pg.wait_for_timeout(1500)
        check(await pg.locator("#passcode").count()==1 and await pg.locator("#passcode-confirm").count()==0,"sign out returns to a normal sign-in form")
        check(await pg.evaluate("sessionStorage.getItem('jagadamba-admin-token')")is None,"sign out clears the session")
        await pg.fill("#passcode","wrong-passcode-value"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(800)
        check("incorrect" in (await pg.inner_text(".login-error")).lower(),"a wrong passcode is refused")
        await pg.fill("#passcode",SECRET); await pg.click("button[type=submit]"); await pg.wait_for_timeout(2000)
        check(await pg.locator("input[type=password]").count()==0,"the right passcode signs in")
        # settings: change passcode
        await pg.goto("http://127.0.0.1:5175/admin/settings",wait_until="load"); await pg.wait_for_selector("#pw-cur",timeout=15000)
        await pg.fill("#pw-cur","not-the-current-one"); await pg.fill("#pw-new","a-brand-new-passcode-9"); await pg.locator("form:has(#pw-cur) button[type=submit]").click(); await pg.wait_for_timeout(1200)
        check("wrong" in (await pg.inner_text("body")).lower(),"changing the passcode needs the current passcode")
        await pg.fill("#pw-cur",SECRET); await pg.fill("#pw-new","short"); await pg.locator("form:has(#pw-cur) button[type=submit]").click(); await pg.wait_for_timeout(1200)
        check("at least 12" in (await pg.inner_text("body")).lower(),"a new passcode under 12 characters is refused")
        await pg.fill("#pw-cur",SECRET); await pg.fill("#pw-new","a-brand-new-passcode-9"); await pg.locator("form:has(#pw-cur) button[type=submit]").click(); await pg.wait_for_timeout(1200)
        check("updated" in (await pg.inner_text("body")).lower(),"a valid change succeeds")
        await pg.click("text=Sign out"); await pg.wait_for_timeout(1200)
        await pg.fill("#passcode",SECRET); await pg.click("button[type=submit]"); await pg.wait_for_timeout(800)
        check("incorrect" in (await pg.inner_text(".login-error")).lower(),"the old passcode no longer works")
        await pg.fill("#passcode","a-brand-new-passcode-9"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(2000)
        check(await pg.locator("input[type=password]").count()==0,"the new passcode works")
        print(f"\nRESULT: {PASS} passed, {FAIL} failed")
        srv.terminate(); await b.close()
asyncio.run(main())
sys.exit(1 if FAIL else 0)
