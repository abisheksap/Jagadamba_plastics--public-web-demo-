"""Convert the uploaded products/ folder into optimized web images.

Outputs:
  public/images/products-v2/  — full catalog images (~900px web-optimized)
  public/images/orbit/        — tighter 640px crops for the home hero orbit
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "products"
OUT_FULL = ROOT / "public" / "images" / "products-v2"
OUT_ORBIT = ROOT / "public" / "images" / "orbit"

SLUG_MAP = {
    "01_Green_Tank.jpg": "green-tank",
    "02_Black_Tank.jpg": "black-tank",
    "03_UG_Drainage-1.png": "ug-drainage-pipe",
    "04_Borewell.png": "borewell-casing-pipe",
    "05_Elbow_90.png": "cpvc-elbow-90",
    "06_25.png": "cpvc-tank-nipple",
    "07_32.png": "cpvc-end-cap",
    "08_12.png": "cpvc-coupler",
    "09_0-50-cpvc-brass-mta-pipe-fittings-with-high-durability-size-3-4-origin.png": "cpvc-mta-brass",
    "10_Socket-Coupler.png": "cpvc-socket-coupler",
    "11_Male_Thread_Adaptor.png": "cpvc-male-adapter",
    "12_Concealed_Valve.png": "cpvc-concealed-valve",
    "13_Male_Adapter_Plastic_Thread.png": "cpvc-male-adapter-plastic",
    "14_Elbow_45.png": "cpvc-elbow-45",
    "15_15.png": "cpvc-tee",
    "16_24.png": "cpvc-union",
    "17_Reducing_Tee.png": "cpvc-reducing-tee",
    "18_1.png": "cpvc-ball-valve",
    "19_Female_Threaded_Adaptor.png": "cpvc-fta",
    "20_Triple_Female_Elbow.png": "cpvc-triple-female-elbow",
    "21_7_1.png": "cpvc-cross-tee",
    "22_Reducing_Bush.png": "cpvc-reducer-bush",
    "23_Union_copy.png": "cpvc-coupler-plain",
    "24_Cross_Tee.png": "cpvc-cross-tee-b",
    "25_18.png": "cpvc-end-plug",
    "26_Pipe_Clamp.png": "cpvc-pipe-clip",
    "27_Female_Adapter_Plastic_Thread.png": "cpvc-fta-plastic",
    "28_11.png": "cpvc-elbow-90-b",
    "29_3.png": "cpvc-step-over-bend",
    "30_Ashirvad_SWR_-Pushfit-Fitting_-Double-Tee-with-Door-_-Cross-Tee-with-D.png": "swr-double-tee-door",
    "31_Round_Jali.png": "pvc-round-jali",
    "32_11_1.png": "cpvc-female-elbow-brass",
    "33_Double_Tee.png": "pvc-double-tee",
    "34_Bend_87_5.png": "pvc-bend-87-5",
    "35_End_Cap.png": "pvc-end-cap",
    "36_Single_Y.png": "pvc-single-y",
    "37_Metal_Clamp.png": "pvc-metal-clamp",
    "38_Multitrap.png": "pvc-multi-floor-trap",
    "39_Single_Tee_with_door.png": "pvc-single-tee-door",
    "40_Single_Y_with_door_copy.png": "pvc-single-y-door",
    "41_Bend_45.png": "pvc-bend-45",
    "42_Single_Tee.png": "pvc-single-tee",
    "43_Metal_Clip.png": "pvc-metal-clip",
    "44_Cleasing_Pipe.png": "pvc-cleaning-pipe",
    "45_pipes_making_PVC-02-02-05-05.png": "pvc-pipe-bundle",
    "46_Square_tile_with_jali.png": "pvc-square-tile-jali",
    "47_Single_Y_with_door.png": "pvc-single-y-door-b",
    "48_Coupler.png": "pvc-coupler",
    "49_Bend_87_5_without_door.png": "pvc-bend-87-5-b",
    "50_Reducer_Tee.png": "pvc-reducer-tee",
    "51_1_1.png": "pvc-socket-plug",
    "52_P-Trap.png": "pvc-p-trap",
    "53_Nahani_Trap.png": "pvc-nahani-trap",
}


def slugify(name: str) -> str:
    stem = Path(name).stem
    stem = unicodedata.normalize("NFKD", stem)
    stem = stem.encode("ascii", "ignore").decode("ascii")
    stem = re.sub(r"[^A-Za-z0-9]+", "-", stem).strip("-").lower()
    return stem or "product"


def convert(src: Path, dst: Path, max_side: int) -> None:
    img = Image.open(src)
    # Flatten any transparency onto white so JPEG output stays clean.
    if img.mode in ("RGBA", "LA", "P"):
        base = Image.new("RGB", img.size, (255, 255, 255))
        img_rgba = img.convert("RGBA")
        base.paste(img_rgba, mask=img_rgba.split()[-1])
        img = base
    else:
        img = img.convert("RGB")
    w, h = img.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    img.save(dst, "JPEG", quality=85, optimize=True, progressive=True)


def main() -> None:
    OUT_FULL.mkdir(parents=True, exist_ok=True)
    OUT_ORBIT.mkdir(parents=True, exist_ok=True)
    count = 0
    for src in sorted(SRC.iterdir()):
        if src.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        slug = SLUG_MAP.get(src.name) or slugify(src.name)
        convert(src, OUT_FULL / f"{slug}.jpg", 900)
        convert(src, OUT_ORBIT / f"{slug}.jpg", 640)
        count += 1
        print(f"  {src.name} -> {slug}.jpg")
    print(f"converted {count} images")
    sys.exit(0)


if __name__ == "__main__":
    main()
