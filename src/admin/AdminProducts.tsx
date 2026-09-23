import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import type { Product, ProductCategory, ProductVariant } from "../data/types";
import { PRODUCT_CATEGORIES } from "../data/types";

const blank = (): Product => ({
  id: "",
  name: "",
  category: PRODUCT_CATEGORIES[0],
  tagline: "",
  description: "",
  image: "",
  specs: [],
  variants: [],
  featured: false,
  sortOrder: 99,
});

export default function AdminProducts() {
  const { products, mode, settings } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [editing, setEditing] = useState<Product | null>(null);
  const [specsText, setSpecsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [filter, setFilter] = useState("All");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const startNew = () => {
    setEditing(blank());
    setSpecsText("");
  };

  const startEdit = (p: Product) => {
    setEditing({ ...p, specs: [...p.specs], variants: (p.variants ?? []).map((v) => ({ ...v })) });
    setSpecsText(p.specs.join("\n"));
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    setBusy(true);
    setError("");
    try {
      // In Convex mode the file goes straight to Convex file storage; local
      // mode falls back to a compact data URL.
      const { url, storageId } = await ops.uploadImage(file);
      setEditing((e) => (e ? { ...e, image: url, imageStorageId: storageId } : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    void onPickFile(e.dataTransfer.files?.[0]);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    void onPickFile(e.target.files?.[0]);
  };

  // ---------- variants editor ----------
  const setVariants = (variants: ProductVariant[]) => setEditing((e) => (e ? { ...e, variants } : e));

  const addVariant = () => {
    if (!editing) return;
    setVariants([...(editing.variants ?? []), { id: `v-${Date.now().toString(36)}`, size: "", price: undefined }]);
  };

  const updateVariant = (idx: number, patch: Partial<ProductVariant>) => {
    if (!editing) return;
    setVariants((editing.variants ?? []).map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const removeVariant = (idx: number) => {
    if (!editing) return;
    setVariants((editing.variants ?? []).filter((_, i) => i !== idx));
  };

  const moveVariant = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const next = [...(editing.variants ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setVariants(next);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim() || !editing.image) return;
    const product: Product = {
      ...editing,
      name: editing.name.trim(),
      tagline: editing.tagline.trim(),
      description: editing.description.trim(),
      specs: specsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      variants: (editing.variants ?? [])
        .map((v) => ({ ...v, size: v.size.trim() }))
        .filter((v) => v.size.length > 0),
      id: editing.id || `p-${Date.now().toString(36)}`,
    };
    try {
      await ops.upsertProduct(product);
      setEditing(null);
      setSavedMsg(`Saved — ${product.name} is live.`);
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const onDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}" from the catalog?`)) return;
    try {
      await ops.deleteProduct(p.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const onTogglePrices = async (checked: boolean) => {
    try {
      const next = { ...settings, showPrices: checked };
      if (mode === "convex") {
        const { convexAdminOps } = await import("../data/backend");
        await convexAdminOps(adminCredential()).updateSettings(next);
      } else {
        await ops.updateSettings(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const sorted = [...products]
    .filter((p) => filter === "All" || p.category === filter)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const variantTotal = products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Products</h1>
          <div className="sub">
            {products.length} products · {variantTotal} size/price variants
            {mode === "convex" ? " · synced live via Convex" : ""}.
          </div>
        </div>
        <button className="admin-btn primary" onClick={startNew}>
          + Add product
        </button>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}
      {savedMsg && (
        <div className="admin-card" style={{ borderColor: "#2e7d55" }}>
          <span style={{ color: "#7dd4a8" }}>{savedMsg}</span>
        </div>
      )}

      {/* PUBLIC PRICE VISIBILITY TOGGLE */}
      <div className="admin-card">
        <h3>Pricing visibility</h3>
        <label className={`admin-toggle${settings.showPrices !== false ? " on" : ""}`}>
          <input
            type="checkbox"
            checked={settings.showPrices !== false}
            onChange={(e) => void onTogglePrices(e.target.checked)}
          />
          <span>
            <span className="t-title">Show prices on the website</span>
            <span className="t-sub" style={{ display: "block" }}>
              When on, cards show "From Rs …" and product pages show the full size/rate table. When
              off, sizes appear without rates and visitors are invited to call instead.
            </span>
          </span>
        </label>
      </div>

      {editing && (
        <div className="admin-card">
          <h3>{editing.id ? `Edit — ${editing.name}` : "New product"}</h3>
          <form onSubmit={onSave}>
            <div className="admin-grid-2">
              <div>
                <div className="admin-field">
                  <label htmlFor="p-name">NAME *</label>
                  <input
                    id="p-name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Green Water Tank"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="p-cat">CATEGORY</label>
                  <select
                    id="p-cat"
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value as ProductCategory })
                    }
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="p-tagline">TAGLINE</label>
                  <input
                    id="p-tagline"
                    value={editing.tagline}
                    onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                    placeholder="One short selling line"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="p-desc">DESCRIPTION</label>
                  <textarea
                    id="p-desc"
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="2–3 sentences shown on the card and detail page"
                  />
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label htmlFor="p-order">SORT ORDER</label>
                    <input
                      id="p-order"
                      type="number"
                      value={editing.sortOrder}
                      onChange={(e) =>
                        setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="p-feat">FEATURED ON HOME</label>
                    <select
                      id="p-feat"
                      value={editing.featured ? "yes" : "no"}
                      onChange={(e) => setEditing({ ...editing, featured: e.target.value === "yes" })}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <div className="admin-field">
                  <label>PRODUCT IMAGE *</label>
                  <div
                    className="dropzone"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                  >
                    {editing.image ? (
                      <img src={editing.image} alt="Product preview" />
                    ) : (
                      <div>Drop an image here or click to browse</div>
                    )}
                    {editing.image && <div style={{ fontSize: 12, marginTop: 6 }}>Click to replace</div>}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onFileInput}
                  />
                  <div className="hint">
                    {busy ? "Uploading…" : "Photos are auto-resized to ~900px JPEG."}
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="p-specs">SPECIFICATIONS (one per line)</label>
                  <textarea
                    id="p-specs"
                    rows={5}
                    value={specsText}
                    onChange={(e) => setSpecsText(e.target.value)}
                    placeholder={"UV-stabilised outer layer\nFood-grade interior"}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="p-pnote">PRICE NOTE (shown under the rate table)</label>
                  <input
                    id="p-pnote"
                    value={editing.priceNote ?? ""}
                    onChange={(e) => setEditing({ ...editing, priceNote: e.target.value })}
                    placeholder="e.g. Rates are per litre of tank capacity…"
                  />
                </div>
              </div>
            </div>

            {/* VARIANTS */}
            <div className="admin-field" style={{ marginTop: 20 }}>
              <label>SIZES &amp; RATES ({(editing.variants ?? []).length})</label>
              <div className="variants-editor">
                {(editing.variants ?? []).map((v, i) => (
                  <div key={v.id} className="variant-row">
                    <input
                      className="vr-size"
                      value={v.size}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      placeholder='Size — e.g. 1/2" or 25mm'
                      aria-label="Variant size"
                    />
                    <input
                      className="vr-price"
                      type="number"
                      step="any"
                      value={v.price ?? ""}
                      onChange={(e) =>
                        updateVariant(i, { price: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                      placeholder="Rate (Rs)"
                      aria-label="Variant price"
                    />
                    <input
                      className="vr-packing"
                      value={v.packing ?? ""}
                      onChange={(e) => updateVariant(i, { packing: e.target.value || undefined })}
                      placeholder="Packing (optional)"
                      aria-label="Variant packing"
                    />
                    <div className="vr-actions">
                      <button type="button" className="admin-btn small" onClick={() => moveVariant(i, -1)} aria-label="Move up">
                        ↑
                      </button>
                      <button type="button" className="admin-btn small" onClick={() => moveVariant(i, 1)} aria-label="Move down">
                        ↓
                      </button>
                      <button type="button" className="admin-btn small danger" onClick={() => removeVariant(i)} aria-label="Remove variant">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="admin-btn" onClick={addVariant}>
                + Add size/rate row
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="admin-btn primary" type="submit" disabled={!editing.name.trim() || !editing.image}>
                Save product
              </button>
              <button className="admin-btn" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {["All", ...PRODUCT_CATEGORIES].map((c) => (
            <button key={c} className={`filter-pill${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>NAME</th>
                <th>CATEGORY</th>
                <th>VARIANTS</th>
                <th>ORDER</th>
                <th>FEATURED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.image}
                      alt=""
                      style={{ width: 44, height: 44, objectFit: "contain", background: "#fff", borderRadius: 4, padding: 3 }}
                    />
                  </td>
                  <td>
                    <strong style={{ color: "#fff" }}>{p.name}</strong>
                    <div style={{ fontSize: 12.5, color: "#7f93a3" }}>{p.tagline}</div>
                  </td>
                  <td>{p.category}</td>
                  <td className="mono">{p.variants?.length ?? 0}</td>
                  <td className="mono">{p.sortOrder}</td>
                  <td>{p.featured ? <span className="badge approved">HOME</span> : "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="admin-btn small" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="admin-btn small danger" onClick={() => onDelete(p)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
