import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import { DOCUMENT_KINDS } from "../data/types";
import type { DocumentItem, DocumentKind } from "../data/types";

const blank = (sortOrder = 10): DocumentItem => ({
  id: "",
  title: "",
  kind: "certificate",
  issuer: "",
  issuedOn: "",
  validUntil: "",
  note: "",
  image: "",
  fileUrl: "",
  sortOrder,
});

const kindLabel = (kind: string) => DOCUMENT_KINDS.find((k) => k.id === kind)?.label ?? "Other";

/** Admin → Documents: certificates, licences and reports shown in "Our documents" on the home page. */
export default function AdminDocuments() {
  const { documents, mode } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const sorted = [...documents].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  const startNew = () => {
    const nextOrder = documents.length ? Math.max(...documents.map((d) => d.sortOrder ?? 0)) + 10 : 10;
    setEditing(blank(nextOrder));
    setError("");
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    setBusy(true);
    setError("");
    try {
      // documents are scanned at a larger size than gallery photos so the text stays readable
      const { url, storageId } = await ops.uploadImage(file, 1400);
      if (!url) throw new Error("That file is not an image. Upload a JPG or PNG scan, and use the link field for a PDF.");
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
  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => void onPickFile(e.target.files?.[0]);

  const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title.trim()) return;
    const item: DocumentItem = {
      ...editing,
      id: editing.id || `d-${Date.now().toString(36)}`,
      title: editing.title.trim(),
      issuer: clean(editing.issuer),
      issuedOn: clean(editing.issuedOn),
      validUntil: clean(editing.validUntil),
      note: clean(editing.note),
      fileUrl: clean(editing.fileUrl),
    };
    try {
      await ops.upsertDocument(item);
      setEditing(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const onDelete = async (d: DocumentItem) => {
    if (!confirm(`Remove "${d.title}" from the website?`)) return;
    try {
      await ops.deleteDocument(d.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  /** Swap a document with its neighbour, renumbering positions 10, 20, 30… so order is always unambiguous. */
  const move = async (d: DocumentItem, dir: -1 | 1) => {
    const i = sorted.findIndex((x) => x.id === d.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      for (let k = 0; k < next.length; k++) {
        const order = (k + 1) * 10;
        if (next[k].sortOrder !== order) await ops.upsertDocument({ ...next[k], sortOrder: order });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    }
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Documents</h1>
          <div className="sub">
            {documents.length} {documents.length === 1 ? "document" : "documents"} shown in “Our documents” at the bottom of the home page
            {mode === "convex" ? " · synced live via Convex" : ""}.
          </div>
        </div>
        <button className="admin-btn primary" onClick={startNew}>
          + Add document
        </button>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}

      {editing && (
        <div className="admin-card">
          <h3>{editing.id ? `Edit — ${editing.title}` : "New document"}</h3>
          <form onSubmit={onSave}>
            <div className="admin-grid-2">
              <div>
                <div className="admin-field">
                  <label htmlFor="d-title">TITLE *</label>
                  <input id="d-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Nepal Standard (NS) certification" required maxLength={160} />
                </div>
                <div className="admin-field">
                  <label htmlFor="d-kind">TYPE</label>
                  <select id="d-kind" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as DocumentKind })}>
                    {DOCUMENT_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="d-issuer">ISSUED BY</label>
                  <input id="d-issuer" value={editing.issuer ?? ""} onChange={(e) => setEditing({ ...editing, issuer: e.target.value })} placeholder="e.g. Nepal Bureau of Standards and Metrology" />
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label htmlFor="d-issued">ISSUED</label>
                    <input id="d-issued" value={editing.issuedOn ?? ""} onChange={(e) => setEditing({ ...editing, issuedOn: e.target.value })} placeholder="e.g. 2079 B.S." />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="d-valid">VALID UNTIL</label>
                    <input id="d-valid" value={editing.validUntil ?? ""} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} placeholder="e.g. 2084 B.S." />
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="d-note">SHORT NOTE</label>
                  <input id="d-note" value={editing.note ?? ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="One line shown under the title" maxLength={140} />
                </div>
                <div className="admin-field">
                  <label htmlFor="d-order">POSITION</label>
                  <input id="d-order" type="number" min={0} step={1} value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })} />
                  <div className="hint">Lower numbers appear first. You can also reorder with the arrows in the list.</div>
                </div>
              </div>
              <div>
                <div className="admin-field">
                  <label>SCAN / PREVIEW IMAGE</label>
                  <div className="dropzone" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
                    {editing.image ? (
                      <img loading="lazy" decoding="async" src={editing.image} alt="Preview" style={{ maxHeight: 200, width: "100%", objectFit: "contain" }} />
                    ) : (
                      <div>Drop a scan or photo here, or click to browse</div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileInput} />
                  <div className="hint">
                    {busy ? "Uploading…" : "Optional. Scans are auto-resized to about 1400px. Without an image the card shows a document icon."}
                  </div>
                  {editing.image && (
                    <button className="admin-btn small" type="button" style={{ marginTop: 8 }} onClick={() => setEditing({ ...editing, image: "", imageStorageId: undefined })}>
                      Remove image
                    </button>
                  )}
                </div>
                <div className="admin-field">
                  <label htmlFor="d-file">LINK TO FULL PDF</label>
                  <input id="d-file" type="url" value={editing.fileUrl ?? ""} onChange={(e) => setEditing({ ...editing, fileUrl: e.target.value })} placeholder="https://… (optional)" />
                  <div className="hint">If set, visitors get an “Open PDF” button.</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="admin-btn primary" type="submit" disabled={!editing.title.trim() || busy}>
                Save document
              </button>
              <button className="admin-btn" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        {sorted.length === 0 ? (
          <div className="empty-state">No documents yet. The “Our documents” section stays hidden until you add one.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ORDER</th>
                  <th>DOCUMENT</th>
                  <th>TYPE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => (
                  <tr key={d.id}>
                    <td>
                      {d.image ? (
                        <img loading="lazy" decoding="async" src={d.image} alt="" style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 3 }} />
                      ) : (
                        <span className="mono" style={{ display: "inline-block", width: 48, textAlign: "center" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="admin-btn small" type="button" aria-label={`Move ${d.title} up`} disabled={i === 0} onClick={() => void move(d, -1)}>▲</button>
                        <button className="admin-btn small" type="button" aria-label={`Move ${d.title} down`} disabled={i === sorted.length - 1} onClick={() => void move(d, 1)}>▼</button>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{d.title}</strong>
                      <div className="hint">{[d.issuer, d.issuedOn].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td>
                      <span className="badge approved">{kindLabel(d.kind).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="admin-btn small" onClick={() => setEditing({ ...d })}>Edit</button>
                        <button className="admin-btn small danger" onClick={() => void onDelete(d)}>Delete</button>
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
