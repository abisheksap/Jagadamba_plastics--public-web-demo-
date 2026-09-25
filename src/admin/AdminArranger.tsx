import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import type { HeroChip, HeroChipLayout, Product } from "../data/types";

interface WorkChip extends HeroChip {
  product: Product;
}

const CANVAS_W = 900;
const CANVAS_H = 560;

/** Mirrors the standalone arrange-controller: stage anchor is (50%, 52%),
 * so y coordinates above 0 sit toward the top of the hero group. */
const ANCHOR = { x: CANVAS_W / 2, y: CANVAS_H * 0.52 };

function defaultSize(chip: WorkChip): { w: number; h: number } {
  const c = chip.product.category;
  if (c === "Water Tank") return { w: 120, h: 150 };
  if (c === "HDPE Pipe" || c === "PVC Pipe" || c === "CPVC Pipe") return { w: 84, h: 150 };
  return { w: 88, h: 88 };
}

function seedLayout(products: Product[]): WorkChip[] {
  // Start from the site's default family-shot arrangement, expressed in the
  // same coordinate space the arranger saves.
  const slots: Array<{ match: string; bx: number; by: number; z: number }> = [
    { match: "jagadamba water tank", bx: -40, by: -160, z: 3 },
    { match: "black tank", bx: 44, by: -150, z: 4 },
    { match: "borewell", bx: 110, by: -130, z: 2 },
    { match: "ug drainage", bx: 138, by: -110, z: 2 },
    { match: "hdpe pipe", bx: 148, by: -90, z: 2 },
    { match: "ns upvc", bx: -116, by: -140, z: 2 },
    { match: "cpvc pipe sdr", bx: -156, by: -120, z: 2 },
    { match: "pvc pipe (commercial)", bx: -186, by: -100, z: 1 },
    { match: "cpvc elbow 90", bx: -59, by: 50, z: 4 },
    { match: "cpvc elbow 45", bx: -156, by: 20, z: 4 },
    { match: "cross tee", bx: -213, by: 36, z: 4 },
    { match: "cpvc union", bx: -213, by: 24, z: 4 },
    { match: "concealed valve", bx: -107, by: 6, z: 4 },
    { match: "reducing tee", bx: -55, by: -5, z: 4 },
    { match: "male thread", bx: 23, by: -11, z: 4 },
    { match: "double tee", bx: 6, by: 55, z: 4 },
    { match: "single tee", bx: 68, by: 46, z: 4 },
    { match: "coupler", bx: 120, by: 32, z: 4 },
    { match: "bend 45", bx: 146, by: -34, z: 4 },
    { match: "end cap", bx: 177, by: 46, z: 4 },
    { match: "p trap", bx: 198, by: -8, z: 4 },
  ];
  const out: WorkChip[] = [];
  const used = new Set<string>();
  for (const slot of slots) {
    const product = products.find((p) => p.name.toLowerCase().includes(slot.match));
    if (product && !used.has(product.id)) {
      used.add(product.id);
      out.push({ productId: product.id, ...slot, product });
    }
  }
  return out;
}

export default function AdminArranger() {
  const { products, heroLayout, mode } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [chips, setChips] = useState<WorkChip[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState(4);
  const [snap, setSnap] = useState(0);
  const [guides, setGuides] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    orig: Map<string, { bx: number; by: number }>;
  } | null>(null);

  // initialize (or refresh when the catalog gains products)
  useEffect(() => {
    setChips((cur) => {
      const byId = new Map<string, Product>(products.map((p) => [p.id, p]));
      if (cur.length > 0) {
        // keep current work, but re-bind products that still exist
        return cur.filter((c) => byId.has(c.productId)).map((c) => ({ ...c, product: byId.get(c.productId)! }));
      }
      const fromSaved: WorkChip[] = (heroLayout?.chips ?? [])
        .filter((c) => byId.has(c.productId))
        .map((c) => ({ ...c, product: byId.get(c.productId)! }));
      return fromSaved.length > 0 ? fromSaved : seedLayout(products);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, heroLayout]);

  const selectedChips = useMemo(() => chips.filter((c) => selected.includes(c.productId)), [chips, selected]);

  const mutate = useCallback((fn: (chips: WorkChip[]) => WorkChip[]) => {
    setChips((cur) => fn(cur));
    setDirty(true);
  }, []);

  const patchSelected = useCallback(
    (patch: (c: WorkChip) => Partial<WorkChip>) => {
      mutate((cur) =>
        cur.map((c) => (selected.includes(c.productId) ? { ...c, ...patch(c) } : c)),
      );
    },
    [mutate, selected],
  );

  /* ---------- selection ---------- */
  const toggleSelect = (id: string, additive: boolean) => {
    setSelected((cur) =>
      additive ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id],
    );
  };
  const clearSel = () => setSelected([]);

  /* ---------- move / align / distribute ---------- */
  const nudge = (dx: number, dy: number) => {
    if (!selectedChips.length) return;
    patchSelected((c) => ({
      bx: c.bx + dx,
      by: c.by + dy,
    }));
  };

  const align = (axis: "x" | "y", mode: "min" | "center" | "max") => {
    if (selectedChips.length < 1) return;
    const boxes = selectedChips.map((c) => {
      const size = defaultSize(c);
      const w = c.w ?? size.w;
      const h = c.h ?? size.h;
      return { id: c.productId, l: ANCHOR.x + c.bx - w / 2, r: ANCHOR.x + c.bx + w / 2, t: ANCHOR.y + c.by - h / 2, b: ANCHOR.y + c.by + h / 2, w, h };
    });
    const minX = Math.min(...boxes.map((b) => b.l));
    const maxX = Math.max(...boxes.map((b) => b.r));
    const minY = Math.min(...boxes.map((b) => b.t));
    const maxY = Math.max(...boxes.map((b) => b.b));
    mutate((cur) =>
      cur.map((c) => {
        const b = boxes.find((x) => x.id === c.productId);
        if (!b) return c;
        let nl = b.l;
        let nt = b.t;
        if (axis === "x") {
          nl = mode === "min" ? minX : mode === "max" ? maxX - b.w : (minX + maxX) / 2 - b.w / 2;
        } else {
          nt = mode === "min" ? minY : mode === "max" ? maxY - b.h : (minY + maxY) / 2 - b.h / 2;
        }
        const snapped = snap > 0
          ? { l: Math.round(nl / snap) * snap, t: Math.round(nt / snap) * snap }
          : { l: nl, t: nt };
        return {
          ...c,
          bx: Math.round((snapped.l + b.w / 2 - ANCHOR.x) * 10) / 10,
          by: Math.round((snapped.t + b.h / 2 - ANCHOR.y) * 10) / 10,
        };
      }),
    );
  };

  const spread = (factor: number) => {
    if (selectedChips.length < 2) return;
    const cx = selectedChips.reduce((t, c) => t + c.bx, 0) / selectedChips.length;
    const cy = selectedChips.reduce((t, c) => t + c.by, 0) / selectedChips.length;
    patchSelected((c) => ({
      bx: Math.round((cx + (c.bx - cx) * factor) * 10) / 10,
      by: Math.round((cy + (c.by - cy) * factor) * 10) / 10,
    }));
  };

  const zOrder = (mode: "up" | "down" | "front" | "back") => {
    if (!selectedChips.length) return;
    const zs = chips.map((chip) => chip.z);
    const lo = Math.min(...zs);
    const hi = Math.max(...zs);
    patchSelected((c) => ({
      z: mode === "up" ? c.z + 1 : mode === "down" ? c.z - 1 : mode === "front" ? hi + 1 : lo - 1,
    }));
  };

  const resize = (dw: number, dh: number) => {
    patchSelected((c) => {
      const size = defaultSize(c);
      const w = c.w ?? size.w;
      const h = c.h ?? size.h;
      return { w: Math.max(30, Math.round(w + dw)), h: Math.max(30, Math.round(h + dh)) };
    });
  };

  const scaleBoth = (delta: number) => resize(delta, delta);

  const resetSize = () => {
    patchSelected(() => ({ w: undefined, h: undefined }));
  };

  /* ---------- add / remove ---------- */
  const addProduct = (p: Product) => {
    if (chips.some((c) => c.productId === p.id)) return;
    // place in a free spot on the back ring so it never lands dead-centre
    const ang = (chips.length / 12) * Math.PI * 2;
    const chip: WorkChip = {
      productId: p.id,
      bx: Math.round(Math.cos(ang) * 260),
      by: Math.round(Math.sin(ang) * 60),
      z: 1,
      product: p,
    };
    mutate((cur) => [...cur, chip]);
    setSelected([p.id]);
    setShowAdd(false);
    setMsg(`Added ${p.name} — drag it into place, then Save arrangement.`);
  };

  const removeSelected = () => {
    if (!selectedChips.length) return;
    const names = selectedChips.map((c) => c.product.name).join(", ");
    mutate((cur) => cur.filter((c) => !selected.includes(c.productId)));
    setSelected([]);
    setMsg(`Removed from the home group: ${names} (the product itself stays in the catalog).`);
  };

  /* ---------- drag ---------- */
  const onChipPointerDown = (e: ReactPointerEvent, chip: WorkChip) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (!selected.includes(chip.productId)) toggleSelect(chip.productId, e.shiftKey);
    else if (e.shiftKey) toggleSelect(chip.productId, true);
    const orig = new Map<string, { bx: number; by: number }>();
    const moving = selected.includes(chip.productId)
      ? selectedChips.some((c) => c.productId === chip.productId)
        ? selectedChips
        : [chip]
      : [chip];
    moving.forEach((c) => orig.set(c.productId, { bx: c.bx, by: c.by }));
    dragRef.current = { id: chip.productId, startX: e.clientX, startY: e.clientY, orig };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onChipPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const canvas = canvasRef.current;
    const scale = canvas ? CANVAS_W / canvas.getBoundingClientRect().width : 1;
    let dx = (e.clientX - drag.startX) * scale;
    let dy = (e.clientY - drag.startY) * scale;
    if (snap > 0) {
      dx = Math.round(dx / snap) * snap;
      dy = Math.round(dy / snap) * snap;
    }
    setChips((cur) =>
      cur.map((c) => {
        const o = drag.orig.get(c.productId);
        if (!o) return c;
        return { ...c, bx: Math.round(o.bx + dx), by: Math.round(o.by + dy) };
      }),
    );
    setDirty(true);
  };

  const onChipPointerUp = () => {
    dragRef.current = null;
  };

  /* ---------- save / reset ---------- */
  const onSave = async () => {
    setBusy(true);
    setError("");
    try {
      const layout: HeroChipLayout = {
        version: 1,
        chips: chips.map(({ productId, bx, by, z, w, h }) => ({ productId, bx, by, z, w, h })),
        updatedBy: "admin",
      };
      await ops.saveHeroLayout(layout);
      setDirty(false);
      setMsg("Arrangement saved — the home page now uses it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const onReset = async () => {
    if (!confirm("Reset the home group to the default family layout?")) return;
    setBusy(true);
    try {
      await ops.clearHeroLayout();
      setChips(seedLayout(products));
      setSelected([]);
      setDirty(false);
      setMsg("Arrangement reset to the default layout.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const notInGroup = products.filter((p) => !chips.some((c) => c.productId === p.id));

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Home product group</h1>
          <div className="sub">
            Drag products to arrange the hero family shot · shift-click to multi-select ·{" "}
            {mode === "convex" ? "synced live via Convex" : "saved in this browser"}.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="admin-btn" onClick={() => setShowAdd((v) => !v)}>
            + Add product to group
          </button>
          <button className="admin-btn" onClick={onReset} disabled={busy}>
            Reset layout
          </button>
          <button className="admin-btn primary" onClick={onSave} disabled={busy || (!dirty && chips.length > 0)}>
            {busy ? "Saving…" : dirty ? "Save arrangement" : "Saved"}
          </button>
        </div>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}
      {msg && (
        <div className="admin-card" style={{ borderColor: "#2e7d55" }}>
          <span style={{ color: "#7dd4a8" }}>{msg}</span>
        </div>
      )}

      {/* ADD PRODUCT PICKER — the piece the old controller was missing */}
      {showAdd && (
        <div className="admin-card">
          <h3>Add a product to the home group</h3>
          <p className="pill-note" style={{ marginBottom: 10 }}>
            {notInGroup.length === 0
              ? "Every product in the catalog is already in the group."
              : `${notInGroup.length} product${notInGroup.length === 1 ? "" : "s"} not yet in the group — click to add.`}
          </p>
          <div className="add-chip-grid">
            {products.map((p) => {
              const added = chips.some((c) => c.productId === p.id);
              return (
                <button key={p.id} className={`add-chip${added ? " added" : ""}`} onClick={() => addProduct(p)}>
                  <img src={p.image} alt="" />
                  <span>
                    {p.name}
                    <span className="ac-cat">{p.category}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-toolbar">
          <span className="pill-note">STEP</span>
          {[1, 4, 10, 25].map((v) => (
            <button key={v} className={`admin-btn small${step === v ? " primary" : ""}`} onClick={() => setStep(v)}>
              {v}
            </button>
          ))}
          <span className="pill-note" style={{ marginLeft: 10 }}>
            SNAP
          </span>
          <input
            type="number"
            min={0}
            step={2}
            value={snap}
            onChange={(e) => setSnap(Math.max(0, Number(e.target.value) || 0))}
            style={{ width: 64 }}
            aria-label="Snap to grid"
          />
          <button
            className={`admin-btn small${guides ? " primary" : ""}`}
            onClick={() => setGuides((v) => !v)}
          >
            Guides
          </button>
          <span className="pill-note" style={{ marginLeft: "auto" }}>
            {selected.length ? `${selected.length} selected` : "nothing selected"}
          </span>
        </div>

        <div
          ref={canvasRef}
          className={`arrange-canvas${guides ? " center-guide middle-guide" : ""}`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) clearSel();
          }}
        >
          {chips.map((c) => {
            const size = defaultSize(c);
            const w = c.w ?? size.w;
            const h = c.h ?? size.h;
            return (
              <div
                key={c.productId}
                className={`arrange-chip${selected.includes(c.productId) ? " selected" : ""}`}
                style={{
                  left: ANCHOR.x + c.bx,
                  top: ANCHOR.y + c.by,
                  width: w,
                  height: h,
                  zIndex: Math.max(1, Math.min(40, 20 + c.z)),
                }}
                onPointerDown={(e) => onChipPointerDown(e, c)}
                onPointerMove={onChipPointerMove}
                onPointerUp={onChipPointerUp}
              >
                <img
                  className="arrange-product-image"
                  src={c.product.image}
                  alt={c.product.name}
                  draggable={false}
                />
                <span className="chip-name">{c.product.name}</span>
              </div>
            );
          })}
        </div>
        <p className="pill-note" style={{ marginTop: 8 }}>
          Coordinates use the same stage space as the standalone arrange-controller (anchor at 50% / 52%).
        </p>
      </div>

      <div className="admin-card">
        <h3>Selected products</h3>
        {selectedChips.length === 0 ? (
          <div className="empty-state">Click a product on the canvas to select it. Shift-click adds to the selection.</div>
        ) : (
          <div className="admin-toolbar">
            <button className="admin-btn small" onClick={() => nudge(-step, 0)}>
              ←
            </button>
            <button className="admin-btn small" onClick={() => nudge(0, -step)}>
              ↑
            </button>
            <button className="admin-btn small" onClick={() => nudge(0, step)}>
              ↓
            </button>
            <button className="admin-btn small" onClick={() => nudge(step, 0)}>
              →
            </button>
            <span className="pill-note" style={{ marginLeft: 8 }}>
              MOVE
            </span>
            <button className="admin-btn small" onClick={() => align("x", "min")}>
              Left
            </button>
            <button className="admin-btn small" onClick={() => align("x", "center")}>
              Centre
            </button>
            <button className="admin-btn small" onClick={() => align("x", "max")}>
              Right
            </button>
            <button className="admin-btn small" onClick={() => align("y", "min")}>
              Top
            </button>
            <button className="admin-btn small" onClick={() => align("y", "center")}>
              Middle
            </button>
            <button className="admin-btn small" onClick={() => align("y", "max")}>
              Bottom
            </button>
            <span className="pill-note" style={{ marginLeft: 8 }}>
              SPREAD
            </span>
            <button className="admin-btn small" onClick={() => spread(0.92)}>
              Closer
            </button>
            <button className="admin-btn small" onClick={() => spread(1.08)}>
              Wider
            </button>
            <span className="pill-note" style={{ marginLeft: 8 }}>
              DEPTH
            </span>
            <button className="admin-btn small" onClick={() => zOrder("up")}>
              Up
            </button>
            <button className="admin-btn small" onClick={() => zOrder("down")}>
              Down
            </button>
            <button className="admin-btn small" onClick={() => zOrder("front")}>
              Bring front
            </button>
            <button className="admin-btn small" onClick={() => zOrder("back")}>
              Send back
            </button>
            <span className="pill-note" style={{ marginLeft: 8 }}>
              SIZE
            </span>
            <button className="admin-btn small" onClick={() => scaleBoth(-6)}>
              Scale−
            </button>
            <button className="admin-btn small" onClick={() => scaleBoth(6)}>
              Scale+
            </button>
            <button className="admin-btn small" onClick={() => resize(-6, 0)}>
              W−
            </button>
            <button className="admin-btn small" onClick={() => resize(6, 0)}>
              W+
            </button>
            <button className="admin-btn small" onClick={() => resize(0, -6)}>
              H−
            </button>
            <button className="admin-btn small" onClick={() => resize(0, 6)}>
              H+
            </button>
            <button className="admin-btn small" onClick={resetSize}>
              Reset
            </button>
            <button className="admin-btn small danger" onClick={removeSelected} style={{ marginLeft: "auto" }}>
              Remove from group
            </button>
          </div>
        )}
      </div>
    </>
  );
}
