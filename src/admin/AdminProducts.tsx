import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import type { Product, ProductCategory } from "../data/types";
import { PRODUCT_CATEGORIES } from "../data/types";

const blank = (): Product => ({
  id: "",
  name: "",
  category: PRODUCT_CATEGORIES[0],
  tagline: "",
  description: "",
  image: "",
  specs: [],
  featured: false,
  sortOrder: 99,
});

export default function AdminProducts() {
  const { products, mode } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [editing, setEditing] = useState<Product | null>(null);
  const [specsText, setSpecsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const startNew = () => {
    setEditing(blank());
    setSpecsText("");
  };

  const startEdit = (p: Product) => {
    setEditing({ ...p });
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
      id: editing.id || `p-${Date.now().toString(36)}`,
    };
    try {
      await ops.upsertProduct(product);
      setEditing(null);
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

  const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Products</h1>
          <div className="sub">
            {products.length} products on the public catalog
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
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
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
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>NAME</th>
                <th>CATEGORY</th>
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
