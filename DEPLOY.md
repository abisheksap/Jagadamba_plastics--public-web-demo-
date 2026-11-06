# Deploying Jagadamba Plastic

The site has two parts: the **website** (static files, any host) and the **backend** (Convex: data, images and
the admin login). Deploy the backend first.

## 1. Backend (Convex)

```bash
npm install
npx convex login
npx convex deploy            # creates the production deployment and prints its URL
npx convex env set ADMIN_PASSCODE "a long, private passphrase" --prod
```

- **`ADMIN_PASSCODE` is the only admin secret.** It lives in Convex, never in the code, the website files or
  the browser. Use at least 12 characters (a few random words is ideal). Without it nobody can sign in.
- Sign in at `https://your-site/admin`. In **Settings** you can change the passcode (10+ characters). The
  new one is stored salted and slow-hashed, and every other signed-in device is signed out.
- Forgot it? Set a new `ADMIN_PASSCODE`, then delete the `passcode` row in the Convex dashboard
  (table `admin`). The environment value is used again.
- Existing sites: an old passcode hash from before this version is ignored on purpose. Set
  `ADMIN_PASSCODE` and sign in with it.

## 2. Website

Set two build-time variables in your host's dashboard (see `.env.example`):

| Variable | Value |
| --- | --- |
| `VITE_CONVEX_URL` | the URL printed by `npx convex deploy` |
| `VITE_SITE_URL` | `https://jagadamba-plastics-public-web-demo.onrender.com` (or your custom domain) |

Build command `npm run build`, output folder `dist`. Ready-made config is included:

- **Render**: `render.yaml` configures the static site and client-side route rewrites. **Vercel**: `vercel.json`. **Netlify**: `netlify.toml`. **Cloudflare Pages**: `public/_headers` and
  `public/_redirects` (no extra setup).
- They add the single-page-app fallback, a strict Content-Security-Policy, clickjacking and HTTPS headers,
  long caching for hashed files, and `noindex` for `/admin`.
- If you use a custom Convex domain, add it to `connect-src` in the three header files.

## 3. Check before going live

```bash
npm run check          # typecheck + 21 server tests + release checks on the production build
python tests/browser/run_all.py   # optional browser tests (pip install playwright; playwright install chromium)
```

`npm run verify` fails the build if a default/hard-coded passcode appears anywhere, if the admin panel
ends up in the first-load JavaScript, or if a header, robots or sitemap file is missing.

After deploying: sign in, change the passcode, add your real certificates under **Documents**, replace the
starter dummy entries, and run the site through <https://securityheaders.com> and Lighthouse.

## What protects the admin

- No default passcode exists anywhere. A build without a backend has **no admin at all**.
- Sign-in returns a random 12-hour session token (only its hash is stored). The passcode is never kept in
  the browser. Signing out revokes the token on the server.
- 5 wrong passcodes lock sign-in for 15 minutes. (This lock is site-wide, so a determined attacker could
  keep the admin locked out; they still could not get in. If that ever happens, use a longer lock or add a
  CAPTCHA.)
- Enquiries (names and phone numbers), pending reviews and the activity log are readable only with a live
  admin session. Visitors' browsers never request them.
- Public forms have a hidden honeypot field, input limits and a rate limit.

## Known limits and next steps

- **Images** are ~14 MB of PNG. They load lazily, but converting them to WebP would cut the weight a lot.
- **sitemap.xml** lists the main pages only; product pages are found through links.
- Uploaded scans are resized in the browser (about 1400 px). PDFs are linked by URL, not uploaded.
