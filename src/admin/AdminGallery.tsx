import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import type { GalleryItem } from "../data/types";

const blank = (sortOrder = 10): GalleryItem => ({
  id: "",
  title: "",
  kind: "photo",
  image: "",
  sortOrder,
});

export default function AdminGallery() {
  const { gallery, mode } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const startNew = () => {
    const nextOrder = gallery.length ? Math.max(...gallery.map((g) => g.sortOrder ?? 0)) + 10 : 10;
    setEditing(blank(nextOrder));
    setVideoUrl("");
  };

  const startEdit = (g: GalleryItem) => {
    setEditing({ ...g });
    setVideoUrl(g.videoUrl ?? "");
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    setBusy(true);
    setError("");
    try {
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
    if (!editing || !editing.title.trim() || !editing.image) return;
    const item: GalleryItem = {
      ...editing,
      title: editing.title.trim(),
      id: editing.id || `g-${Date.now().toString(36)}`,
      videoUrl: editing.kind === "video" && videoUrl.trim() ? videoUrl.trim() : undefined,
    };
    try {
      await ops.upsertGalleryItem(item);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const onDelete = async (g: GalleryItem) => {
    if (!confirm(`Remove "${g.title}" from the gallery?`)) return;
    try {
      await ops.deleteGalleryItem(g.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Gallery</h1>
          <div className="sub">
            {gallery.length} tiles shown on the public gallery page
            {mode === "convex" ? " · synced live via Convex" : ""}.
          </div>
        </div>
        <button className="admin-btn primary" onClick={startNew}>
          + Add tile
        </button>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}

      {editing && (
        <div className="admin-card">
          <h3>{editing.id ? `Edit — ${editing.title}` : "New gallery tile"}</h3>
          <form onSubmit={onSave}>
            <div className="admin-grid-2">
              <div>
                <div className="admin-field">
                  <label htmlFor="g-title">TITLE *</label>
                  <input
                    id="g-title"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="e.g. Site — Pokhara"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="g-order">POSITION</label>
                  <input
                    id="g-order"
                    type="number"
                    min={0}
                    step={1}
                    value={editing.sortOrder ?? 0}
                    onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })}
                  />
                  <div className="hint">Lower numbers appear first on the public gallery.</div>
                </div>
                <div className="admin-field">
                  <label htmlFor="g-kind">TYPE</label>
                  <select
                    id="g-kind"
                    value={editing.kind}
                    onChange={(e) => setEditing({ ...editing, kind: e.target.value as GalleryItem["kind"] })}
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video (links out)</option>
                  </select>
                </div>
                {editing.kind === "video" && (
                  <div className="admin-field">
                    <label htmlFor="g-url">VIDEO URL</label>
                    <input
                      id="g-url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/…"
                    />
                  </div>
                )}
              </div>
              <div className="admin-field">
                <label>IMAGE *</label>
                <div
                  className="dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                >
                  {editing.image ? (
                    <img src={editing.image} alt="Preview" style={{ maxHeight: 110, width: "100%", objectFit: "cover" }} />
                  ) : (
                    <div>Drop a photo here or click to browse</div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onFileInput}
                />
                <div className="hint">{busy ? "Uploading…" : "Photos are auto-resized to ~900px JPEG."}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="admin-btn primary" type="submit" disabled={!editing.title.trim() || !editing.image}>
                Save tile
              </button>
              <button className="admin-btn" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        {gallery.length === 0 ? (
          <div className="empty-state">No gallery tiles yet — add the first one.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>POSITION</th>
                  <th>TITLE</th>
                  <th>TYPE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {[...gallery]
                  .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
                  .map((g) => (
                  <tr key={g.id}>
                    <td>
                      <img
                        src={g.image}
                        alt=""
                        style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 3 }}
                      />
                    </td>
                    <td>
                      <span className="mono">{g.sortOrder ?? "—"}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{g.title}</strong>
                    </td>
                    <td>
                      <span className={`badge ${g.kind === "video" ? "new" : "approved"}`}>
                        {g.kind.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="admin-btn small" onClick={() => startEdit(g)}>
                          Edit
                        </button>
                        <button className="admin-btn small danger" onClick={() => onDelete(g)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
