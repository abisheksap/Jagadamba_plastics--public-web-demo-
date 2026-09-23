# End-to-end verification checklist

Run in the browser (preview URL) with devtools console. All checks pass on the dev server as of this writing.

## Public site

1. **Catalog loads with 61 products** — `/products` shows the full grid; search for `PN16` filters correctly; category pills show counts.
2. **Price list shows** — open `/products/hdpe-pipe` → variant table with 105 rows (PN8–PN20 × sizes); "PRICE LIST · EFFECTIVE 2082/09/01" label visible.
3. **Tank per-litre note** — `/products/water-tank` shows "Rates are per litre..." under the table.
4. **Prices hidden mode** — Admin → Products → toggle "Show prices on the website" OFF → product cards no longer show "From Rs …", detail page shows size chips instead of rates; toggle back ON restores.
5. **Black tank fixed** — `/` hero: the two tanks now sit front-centre as a pair; the black tank is large (122×158) not off-side.
6. **Orbit cap** — home hero shows a capped set of chips (no overflow), still scatters on hover.

## Forms (critical)

7. **Enquiry form** — submit on `/contact`: success state shows "Enquiry sent ✓"; the entry appears in Admin → Enquiries as "new".
8. **Product enquiry** — `/products/:id` form pre-fills interest with the product name.
9. **Review form** — `/reviews` → submit → "Review submitted ✓"; entry appears in Admin → Reviews as **pending** (not public until approved).
10. **Moderation gate** — approve a pending review in admin → it appears on `/reviews` and home.

## Admin

11. **Variants editor** — Admin → Products → Edit any product → add a size/rate row, save → change is live on the public page instantly.
12. **Dashboard counts** — Admin dashboard shows "Products live: 61", "Size / rate variants: 395".
13. **Settings persistence** — Settings → Save; reload; values persist. Passcode change works with the current passcode.
