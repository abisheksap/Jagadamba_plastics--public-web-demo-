"""Build src/data/seedCatalog.ts from the Excel price data + converted images."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICE = json.loads((ROOT / "src" / "data" / "priceData.json").read_text())
IMGDIR = ROOT / "public" / "images" / "products-v2"
imgs = {p.stem: f"/images/products-v2/{p.name}" for p in IMGDIR.iterdir()}
# fall back to the original extracted prototype images (e.g. HDPE bundle)
OLDDIR = ROOT / "public" / "images" / "products"
for p in OLDDIR.iterdir():
    imgs.setdefault(p.stem, f"/images/products/{p.name}")


def rows(cat, prod=None):
    out = [r for r in PRICE["rows"] if r["category"] == cat and (prod is None or r["product"] == prod)]
    return out


def vmap(rs, size_key=("mm", "inch", "spec"), name_key="product"):
    """Excel rows -> variant dicts."""
    out = []
    for i, r in enumerate(rs):
        parts = [r.get(k) for k in size_key if r.get(k)]
        size = " · ".join(parts) if parts else "Standard"
        out.append({"id": f"v{i+1}", "size": size, "spec": r.get("spec"), "price": r.get("rate"), "packing": (f"Packing: {int(r['packing'])} pcs" if r.get("packing") else None)})
    return out


def price_note(rs):
    notes = {r["note"] for r in rs if r.get("note")}
    return "; ".join(sorted(notes)) or None


# ---------- catalog definition ----------
# (id, name, category, tagline, description, image, specs, featured, sort, variant-rows, priceNote)
P = []

# CPVC Pipe (6 SDR11 rows)
rs = rows("CPVC Pipe")
P.append(("cpvc-pipe-sdr11", "CPVC Pipe SDR 11", "CPVC Pipe", "Hot & cold lines, SDR 11",
  "Chlorinated PVC pressure pipe for hot and cold water plumbing. Heat-resistant formulation rated for household and industrial hot-water lines.",
  imgs.get("cpvc-coupler") or "", ["SDR 11 pressure rating", "Hot & cold water rated", "Solvent-weld joints", "Sizes 1/2\" to 2\""], True, 20, rs, None))

# CPVC Fittings: group by product name
cpvc_f = {}
for r in rows("CPVC Fittings"):
    cpvc_f.setdefault(r["product"], []).append(r)

cpvc_fit_meta = {
  "Reducer Bush": ("cpvc-reducer-bush", imgs.get("cpvc-reducer-bush"), "Step down cleanly", "Reducing bush to step pipe sizes down within a socket joint.", ["Solvent-weld sockets", "All standard reductions"], False),
  "Reducer (Coupler)": ("cpvc-reducer-coupler", imgs.get("cpvc-coupler-plain"), "Join two sizes", "Reducing coupler joining two different CPVC pipe sizes in-line.", ["In-line reduction", "Solvent-weld sockets"], False),
  "Reducer Tee": ("cpvc-reducer-tee", imgs.get("cpvc-reducing-tee"), "Branch to smaller lines", "Tee with a reduced branch for stepping main lines down to fixture branches.", ["Reduced branch outlet", "Heat resistant"], False),
  "Female Tee (Brass Threaded)": ("cpvc-female-tee-brass", imgs.get("cpvc-fta-plastic"), "Brass outlet branch", "Tee with brass female thread — a metal-safe outlet for mixer and tap connections.", ["Brass threaded outlet", "Metal-to-plastic transition"], False),
  "Male Threaded Adapter (Brass)": ("cpvc-mta-brass", imgs.get("cpvc-mta-brass"), "Metal meets plastic", "Male brass threaded adapter for joining CPVC lines to threaded metal fittings.", ["Brass thread insert", "Pressure-tight seal"], False),
  "Coupler": ("cpvc-coupler", imgs.get("cpvc-coupler"), "Join runs cleanly", "Plain coupler joining two equal CPVC pipe sizes with precision-molded sockets.", ["Uniform wall thickness", "Precision sockets"], False),
  "End Cap": ("cpvc-end-cap", imgs.get("cpvc-end-cap"), "Close lines safely", "End cap sealing CPVC line ends for testing or future extension.", ["Pressure-tight seal", "All standard sizes"], False),
  "Female Threaded Adapter": ("cpvc-fta", imgs.get("cpvc-fta"), "Female thread transition", "Female threaded adapter (FTA) for tap and fixture connections on CPVC lines.", ["Plastic thread", "Solvent-weld spigot"], False),
  "Male Adapter (Plastic Threaded)": ("cpvc-male-adapter-plastic", imgs.get("cpvc-male-adapter-plastic"), "Plastic-thread transition", "Male threaded adapter (MTA) with molded plastic thread for fixture connections.", ["Molded plastic thread", "Solvent-weld spigot"], False),
  "Elbow 45°": ("cpvc-elbow-45", imgs.get("cpvc-elbow-45"), "Gentle hot-line turn", "45° CPVC elbow for gentler direction changes with low pressure loss.", ["45° turn", "Low pressure loss"], False),
  "Tank Nipple": ("cpvc-tank-nipple", imgs.get("cpvc-tank-nipple"), "Tank outlet thread", "Nipple for tank outlets — threaded connection from storage to CPVC lines.", ["Threaded both ends", "Tank-rated"], False),
  "TEE": ("cpvc-tee", imgs.get("cpvc-tee"), "The classic branch", "Equal tee branching a CPVC main into an equal-sized line.", ["Equal outlets", "Heat resistant"], False),
  "Union": ("cpvc-union", imgs.get("cpvc-union"), "Serviceable joints", "Union fitting that lets hot-water lines be opened for service without cutting.", ["Re-openable joint", "Service friendly"], False),
  "Ball Valve": ("cpvc-ball-valve", imgs.get("cpvc-ball-valve"), "Full-flow control", "CPVC ball valve for positive on/off control of hot and cold lines.", ["Quarter-turn operation", "Full-bore flow"], False),
  "Metal Pipe Clip": ("cpvc-pipe-clip", imgs.get("cpvc-pipe-clip"), "Hold lines tight", "Clamp-style clip securing CPVC pipe runs to walls and structures.", ["Rust-resistant metal", "Sizes 1/2\" to 1\""], False),
  "Elbow 90": ("cpvc-elbow-90", imgs.get("cpvc-elbow-90"), "Hot-water corner piece", "90° elbow for sharp direction changes on hot-water lines.", ["90° turn", "Solvent-weld sockets"], False),
  "Female Elbow Brass": ("cpvc-female-elbow-brass", imgs.get("cpvc-female-elbow-brass"), "Brass corner outlet", "Elbow with brass female thread for angled tap and mixer connections.", ["Brass thread outlet", "Heat resistant"], False),
  "FTA Brass (Female Threaded Adapter)": ("cpvc-fta-brass", imgs.get("cpvc-fta"), "Brass female adapter", "Brass-insert FTA for durable fixture connections on CPVC lines.", ["Brass insert", "Pressure-tight"], False),
  "End Plug": ("cpvc-end-plug", imgs.get("cpvc-end-plug"), "Plug a socket", "End plug closing a socket opening for testing or capping.", ["Push-fit plug", "All standard sizes"], False),
  "CPVC Solvent Cement": ("cpvc-solvent-cement", imgs.get("cpvc-socket-coupler"), "Weld it right", "Solvent cement formulated for CPVC — strong, fast-setting joints.", ["CPVC formulation", "Fast setting"], False),
  "FTA Hex Brass": ("cpvc-fta-hex", imgs.get("cpvc-fta"), "Hex-grip adapter", "Hex-bodied brass FTA for wrench-tight fixture connections.", ["Hex brass body", "Wrench friendly"], False),
  "MTA Hex Brass": ("cpvc-mta-hex", imgs.get("cpvc-mta-brass"), "Hex-grip adapter", "Hex-bodied brass MTA for wrench-tight CPVC-to-metal joints.", ["Hex brass body", "Wrench friendly"], False),
  "Triple Brass Elbow": ("cpvc-triple-female-elbow", imgs.get("cpvc-triple-female-elbow"), "Triple brass outlet", "Triple-outlet elbow with brass threads for clustered fixture connections.", ["Three outlets", "Brass threads"], False),
  "Concealed Valve": ("cpvc-concealed-valve", imgs.get("cpvc-concealed-valve"), "Hidden control point", "Concealed valve body for flush-mounted control points in hot-water plumbing.", ["Flush-mount body", "Serviceable cartridge"], False),
  "Cross TEE": ("cpvc-cross-tee", imgs.get("cpvc-cross-tee-b"), "Four-way branch", "Cross tee for four-way branching on CPVC distribution.", ["Four-way branch", "Uniform sockets"], False),
  "Step Over Bend": ("cpvc-step-over-bend", imgs.get("cpvc-step-over-bend"), "Cross lines cleanly", "Step-over bend letting two CPVC lines cross without clashing.", ["Offset geometry", "Solvent-weld"], False),
  "Double Brass Elbow": ("cpvc-double-brass-elbow", imgs.get("cpvc-triple-female-elbow"), "Double brass outlet", "Double-outlet elbow with brass threads for twin fixture connections.", ["Two outlets", "Brass threads"], False),
}
for name, meta in cpvc_fit_meta.items():
    rs = cpvc_f.get(name, [])
    if not rs:
        continue
    pid, image, tag, desc, specs, feat = meta
    P.append((pid, f"CPVC {name}" if name not in ("Concealed Valve", "CPVC Solvent Cement") else name, "CPVC Fittings", tag, desc, image, specs, feat, 30, rs, None))

# PVC Fittings: group by product name
pvc_f = {}
for r in rows("PVC Fittings"):
    pvc_f.setdefault(r["product"], []).append(r)

pvc_fit_meta = {
  "Coupler": ("pvc-coupler", imgs.get("pvc-coupler"), "Join runs cleanly", "Coupler joining two equal PVC pipe sizes with a precision-molded socket.", ["Socket & threaded types", "Uniform wall thickness"], False),
  "PVC Solvent Cement": ("pvc-solvent-cement", imgs.get("pvc-socket-plug"), "Weld it right", "Solvent cement for PVC pressure and drainage joints — strong, fast-setting bonds.", ["Fast setting", "Drainage & pressure rated"], False),
  "Single Tee Door": ("pvc-single-tee-door", imgs.get("pvc-single-tee-door"), "Branch with access", "Single tee with removable door for drain access and cleaning.", ["Access door", "Drainage rated"], False),
  "Reducer \"Y\"": ("pvc-reducer-y", imgs.get("pvc-single-y"), "Sweep to smaller", "Reducer Y combining a 45° sweep with a size reduction for drainage lines.", ["Sweep geometry", "Low clog risk"], False),
  "Double Tee": ("pvc-double-tee", imgs.get("pvc-double-tee"), "Branch twice", "Double-tee fitting branching twice, precision-molded for a tight seal.", ["Precision molded", "Tight solvent weld"], False),
  "Double Tee (With Door)": ("pvc-double-tee-door", imgs.get("swr-double-tee-door"), "Two branches + access", "Double tee with access door for two branches plus maintenance entry.", ["Access door", "Two branches"], False),
  "Socket Plug": ("pvc-socket-plug", imgs.get("pvc-socket-plug"), "Plug a socket", "Socket plug closing PVC socket ends for testing or capping.", ["Push-fit plug", "All standard sizes"], False),
  "Multi Floor Trap": ("pvc-multi-floor-trap", imgs.get("pvc-multi-floor-trap"), "Multi-floor seal", "Multi-floor trap holding a deep water seal for multi-storey drainage.", ["Deep water seal", "Odour-proof"], False),
  "Square Tile with Jali": ("pvc-square-tile-jali", imgs.get("pvc-square-tile-jali"), "Floor drain tile", "Square floor tile with jali grate for terrace and bathroom drains.", ["Jali grate", "Flush-fit tile"], False),
  "Square Tile": ("pvc-square-tile", imgs.get("pvc-square-tile-jali"), "Clean floor finish", "Square floor tile covering floor drains with a clean finish.", ["Flush-fit tile", "Easy removal"], False),
  "Single Tee": ("pvc-single-tee", imgs.get("pvc-single-tee"), "The classic branch", "Single-tee branch fitting for standard PVC pressure and drainage lines.", ["Equal & reducing sizes", "Pressure rated"], False),
  "Metal Pipe Clip": ("pvc-metal-clip", imgs.get("pvc-metal-clip"), "Hold lines tight", "Metal clip securing PVC pipe runs to walls and structures.", ["Rust-resistant", "Quick install"], False),
  "Cleaning Pipe": ("pvc-cleaning-pipe", imgs.get("pvc-cleaning-pipe"), "Access for rodding", "Cleaning pipe providing rodding access along drainage runs.", ["Rodding access", "Drainage rated"], False),
  "Reducer": ("pvc-reducer", imgs.get("pvc-coupler"), "Step down in-line", "Reducer coupler stepping drainage lines down to smaller sizes in-line.", ["In-line reduction", "Solvent weld"], False),
  "Bend 45°": ("pvc-bend-45", imgs.get("pvc-bend-45"), "Turns without turbulence", "45° bend for smooth directional changes without flow turbulence.", ["45° turn", "Low turbulence bore"], False),
  "Reducer Tee": ("pvc-reducer-tee", imgs.get("pvc-reducer-tee"), "Branch to smaller", "Reducing tee branching a drainage main down to smaller lines.", ["Reduced branch", "Solvent weld"], False),
  "End Cap": ("pvc-end-cap", imgs.get("pvc-end-cap"), "Close lines safely", "End cap closing PVC lines safely for testing or future extension.", ["Pressure-tight seal", "All standard sizes"], False),
  "P Trap": ("pvc-p-trap", imgs.get("pvc-p-trap"), "Seal out odours", "P-trap waste fitting holding a water seal to keep drain odours out.", ["Odour-sealing water trap", "Self-cleaning curve"], False),
  "Door Bend 87.5°": ("pvc-door-bend-87-5", imgs.get("pvc-bend-87-5-b"), "Bend with access", "87.5° bend with removable door for drainage access at direction changes.", ["Access door", "87.5° turn"], False),
  "Bend 87.5°": ("pvc-bend-87-5", imgs.get("pvc-bend-87-5"), "Near-sweep turn", "87.5° near-sweep bend for efficient drainage direction changes.", ["87.5° turn", "Self-scouring flow"], False),
  "Single \"Y\"": ("pvc-single-y", imgs.get("pvc-single-y"), "Sweep branch", "Single-Y sweep branch for smooth, low-clog drainage branching.", ["45° sweep branch", "Low clog risk"], False),
  "Single \"Y\" (With Door)": ("pvc-single-y-door", imgs.get("pvc-single-y-door"), "Sweep + access", "Single-Y with access door combining a smooth sweep with cleaning entry.", ["Access door", "45° sweep"], False),
  "Vent Cowl": ("pvc-vent-cowl", imgs.get("pvc-round-jali"), "Cap the stack", "Vent cowl capping drainage stacks against rain and debris ingress.", ["Rain-shielded cap", "Debris guard"], False),
  "Round Jali": ("pvc-round-jali", imgs.get("pvc-round-jali"), "Grate it shut", "Round jali grate covering floor drains while water passes freely.", ["Round grate", "Debris guard"], False),
  "Nahani Trap": ("pvc-nahani-trap", imgs.get("pvc-nahani-trap"), "Floor-drain seal", "Nahani trap sealing floor drains against odours and insects.", ["Floor-drain water seal", "Insect barrier"], False),
}
for name, meta in pvc_fit_meta.items():
    rs = pvc_f.get(name, [])
    if not rs:
        continue
    pid, image, tag, desc, specs, feat = meta
    P.append((pid, f"PVC {name}" if name not in ("PVC Solvent Cement",) else name, "PVC Fittings", tag, desc, image, specs, feat, 40, rs, None))

# PVC Pipe NS UPVC (11 rows by pressure)
rs = rows("PVC Pipe — NS UPVC (NS 206/046)")
P.append(("pvc-pipe-ns", "NS UPVC Pipe", "PVC Pipe", "Nationwide workhorse",
  "NS-certified uPVC pressure pipe to NS 206/046 — the standard for plumbing and distribution lines.",
  imgs.get("pvc-pipe-bundle"), ["NS 206/046 certified", "Smooth bore, high flow", "Sizes 50–200mm"], True, 10, rs, None))

rs = rows("PVC Pipe — Commercial (Non-NS)")
P.append(("pvc-pipe-commercial", "PVC Pipe (Commercial)", "PVC Pipe", "Value grade, same care",
  "Commercial-grade uPVC pressure pipe for cost-sensitive projects that still demand clean, drink-safe lines.",
  imgs.get("pvc-pipe-bundle"), ["Economy grade", "Sizes 50–200mm", "Pressure rated 2.5–10 kgf/cm²"], False, 11, rs, None))

# Borewell (12 rows: Class C/D/E × 4 sizes)
rs = rows("Borewell PVC Pipe (BS:3505)")
P.append(("borewell-casing-pipe", "Borewell Casing Pipe", "PVC Pipe", "Deep-well strength",
  "High-strength borewell casing to BS:3505 in Class C, D and E — built to withstand deep-set groundwater extraction conditions.",
  imgs.get("borewell-casing-pipe"), ["BS:3505 standard", "Class C / D / E", "Sizes 1½\"–6\""], True, 12, rs, None))

# UG Drainage (8 rows SN4/SN8)
rs = rows("UG Drainage uPVC Pipe")
P.append(("ug-drainage-pipe", "UG Drainage Pipe", "PVC Pipe", "Underground, under load",
  "Ring-stiffness SN4 and SN8 underground drainage pipe engineered for long-term structural load and corrosion resistance.",
  imgs.get("ug-drainage-pipe"), ["SN4 & SN8 stiffness", "Corrosion proof", "Sizes 2½\"–8\""], True, 13, rs, None))

# HDPE (105 rows PN/SDR)
rs = rows("HDPE PE100 Pipe (NS 40:2079)")
P.append(("hdpe-pipe", "HDPE PE100 Pipe", "HDPE Pipe", "Flexible supply & irrigation mains",
  "Flexible NS 40:2079 certified PE100 pipe from 16mm to 200mm across PN8–PN20 pressure classes — leak-resistant joints for supply and irrigation.",
  imgs.get("hdpe-pipe-bundle"), ["NS 40:2079 certified", "PE100 resin", "PN8–PN20 classes", "Sizes 16–200mm"], True, 14, rs,
  "HDPE prices exclude 13% VAT/Excise (unlike other price lists)."))

# Tanks (5 rows, per-litre) — split into green (standard) + black (colour) tanks
rs_all = rows("Water Storage Tank")
grade_rows = [r for r in rs_all if "Surcharge" not in r["product"]]
surcharge_rows = [r for r in rs_all if "Surcharge" in r["product"]]
tank_note = "Rates are per litre of tank capacity. 200L/300L sizes add Rs 1.4/litre on Heavy & Extra Heavy; colour tanks add Rs 0.3/litre."
P.append(("water-tank", "Jagadamba Water Tank", "Water Tank", "Rooftop storage, built for the sun",
  "Threaded water storage tanks in three grades — Standard, Heavy and Extra Heavy — with 200L/300L and colour options. Rate shown is per litre of capacity.",
  imgs.get("green-tank"), ["UV-stabilised layers", "Food-grade interior", "Threaded lids", "Standard / Heavy / Extra Heavy"], True, 15, grade_rows, tank_note))
P.append(("black-tank", "Jagadamba Black Tank", "Water Tank", "Algae-free dark interior",
  "Dark-body storage tank that blocks sunlight to keep stored water cool and algae-free. Rate shown is per litre of capacity.",
  imgs.get("black-tank"), ["Sunlight-blocking body", "Food-grade interior", "Multi-layer construction", "Colour-tank grade"], False, 16, grade_rows,
  tank_note))

# Tools (3 rows)
rs = rows("Tools & Accessories")
P.append(("tools-accessories", "Installation Tools", "CPVC Fittings", "Fit it like a pro",
  "Pressure testing machine and CPVC pipe cutters for clean, professional installations.",
  imgs.get("cpvc-elbow-90"), ["Pressure testing machine", "Cutters for 36mm & 63mm"], False, 60, rs, None))

# ---------- emit TypeScript ----------
lines = []
lines.append('// AUTO-GENERATED by scripts/generate-catalog.py — do not edit by hand.')
lines.append('// Source: jp-plastic-price-list-2082-09-01.xlsx (394 rows) + converted product photos.')
lines.append('import type { Product } from "./types";')
lines.append('')
lines.append('export const SEED_PRODUCTS: Product[] = [')
for (pid, name, cat, tag, desc, image, specs, feat, sort, rs, pnote) in P:
    if not rs:
        continue
    variants = vmap(rs)
    lines.append('  {')
    lines.append(f'    id: {json.dumps(pid)},')
    lines.append(f'    name: {json.dumps(name)},')
    lines.append(f'    category: {json.dumps(cat)},')
    lines.append(f'    tagline: {json.dumps(tag)},')
    lines.append(f'    description: {json.dumps(desc)},')
    lines.append(f'    image: {json.dumps(image)},')
    lines.append(f'    specs: {json.dumps(specs)},')
    lines.append('    variants: [')
    for v in variants:
        fields = [f'id: {json.dumps(v["id"])}', f'size: {json.dumps(v["size"])}']
        if v.get("spec"): fields.append(f'spec: {json.dumps(v["spec"])}')
        if v.get("price") is not None: fields.append(f'price: {v["price"]}')
        if v.get("packing"): fields.append(f'packing: {json.dumps(v["packing"])}')
        lines.append(f'      {{ {", ".join(fields)} }},')
    lines.append('    ],')
    if pnote:
        lines.append(f'    priceNote: {json.dumps(pnote)},')
    lines.append(f'    featured: {"true" if feat else "false"},')
    lines.append(f'    sortOrder: {sort},')
    lines.append('  },')
lines.append('];')

(ROOT / "src" / "data" / "seedCatalog.ts").write_text("\n".join(lines) + "\n")
print(f"wrote seedCatalog.ts with {len([p for p in P if p[9]])} products")
