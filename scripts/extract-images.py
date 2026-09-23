#!/usr/bin/env python3
"""One-off: pull the base64 images out of the legacy prototype HTML into
public/images/products/<slug>.<ext> so the Vite app can reference real files."""
import base64, os, re, shutil, sys

SRC = "jagadamba-plastic-website (3).html"
OUT = os.path.join("public", "images")

html = open(SRC, encoding="utf-8").read()

def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[°'\"()]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s

# only product photo chips: <img src="data:..." alt="Black Tank" loading="lazy">
pattern = re.compile(
    r'<img\s+src="data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)"\s+alt="([^"]+)"\s+loading="lazy"',
    re.IGNORECASE,
)

os.makedirs(os.path.join(OUT, "products"), exist_ok=True)
count = 0
for m in pattern.finditer(html):
    ext, b64, alt = m.group(1).lower(), m.group(2), m.group(3)
    if ext == "jpg":
        ext = "jpeg"
    slug = slugify(alt)
    if not slug:
        continue
    path = os.path.join(OUT, "products", f"{slug}.{ext}")
    with open(path, "wb") as f:
        f.write(base64.b64decode(b64))
    count += 1
    print(f"{path}  <- {alt}")

# logo: copy the standalone upload into the public dir (dedupe to png name)
logo_src = "jagadamba_logo-png.png"
if os.path.exists(logo_src):
    shutil.copyfile(logo_src, os.path.join(OUT, "logo.png"))
    print(os.path.join(OUT, "logo.png"), "<- jagadamba_logo-png.png")

print(f"\nextracted {count} product images")
sys.exit(0)
