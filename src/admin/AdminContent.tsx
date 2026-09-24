import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";
import type { Leader, SiteContent } from "../data/types";

export default function AdminContent() {
  const { content, mode } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [form, setForm] = useState<SiteContent>(() => JSON.parse(JSON.stringify(content)) as SiteContent);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [uploadIdx, setUploadIdx] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const set = (patch: Partial<SiteContent>) => setForm((f) => ({ ...f, ...patch }));
  const setLeader = (idx: number, patch: Partial<Leader>) =>
    setForm((f) => ({
      ...f,
      leaders: f.leaders.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }));

  const addLeader = () =>
    setForm((f) => ({
      ...f,
      leaders: [
        ...f.leaders,
        {
          id: `leader-${Date.now().toString(36)}`,
          role: "Director",
          name: "",
          nepaliRole: "",
          message: "",
          initials: "JP",
        },
      ],
    }));

  const removeLeader = (idx: number) => {
    if (!confirm("Remove this leadership card?")) return;
    setForm((f) => ({ ...f, leaders: f.leaders.filter((_, i) => i !== idx) }));
  };

  const uploadLeaderImage = async (idx: number, file: File | undefined) => {
    if (!file) return;
    setUploadIdx(idx);
    setError("");
    try {
      const { url, storageId } = await ops.uploadImage(file);
      setLeader(idx, { image: url, imageStorageId: storageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadIdx(null);
    }
  };

  const onDrop = (idx: number) => (e: DragEvent) => {
    e.preventDefault();
    void uploadLeaderImage(idx, e.dataTransfer.files?.[0]);
  };
  const onFileInput = (idx: number) => (e: ChangeEvent<HTMLInputElement>) => {
    void uploadLeaderImage(idx, e.target.files?.[0]);
  };

  const onSave = async () => {
    setBusy(true);
    setError("");
    try {
      await ops.updateContent(form);
      setMsg("Content saved — the website updates immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Site content</h1>
          <div className="sub">
            Hero, about story and leadership messages —{" "}
            {mode === "convex" ? "synced live via Convex" : "saved in this browser"}.
          </div>
        </div>
        <button className="admin-btn primary" onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : "Save content"}
        </button>
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

      <div className="admin-card">
        <h3>Home hero</h3>
        <div className="admin-field">
          <label htmlFor="c-eyebrow">EYEBROW (small line above the headline)</label>
          <input id="c-eyebrow" value={form.heroEyebrow} onChange={(e) => set({ heroEyebrow: e.target.value })} />
        </div>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label htmlFor="c-h1">HEADLINE — LINE 1</label>
            <input id="c-h1" value={form.heroTitleLine1} onChange={(e) => set({ heroTitleLine1: e.target.value })} />
          </div>
          <div className="admin-field">
            <label htmlFor="c-h2">HEADLINE — LINE 2 (highlighted)</label>
            <input id="c-h2" value={form.heroTitleLine2} onChange={(e) => set({ heroTitleLine2: e.target.value })} />
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="c-sub">SUB-HEADLINE</label>
          <textarea id="c-sub" rows={3} value={form.heroSub} onChange={(e) => set({ heroSub: e.target.value })} />
        </div>
      </div>

      <div className="admin-card">
        <h3>About page</h3>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label htmlFor="c-atitle">ABOUT HEADLINE</label>
            <input id="c-atitle" value={form.aboutTitle} onChange={(e) => set({ aboutTitle: e.target.value })} />
          </div>
          <div className="admin-field">
            <label htmlFor="c-asub">ABOUT SUB-HEADLINE</label>
            <input id="c-asub" value={form.aboutSub} onChange={(e) => set({ aboutSub: e.target.value })} />
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="c-s1">OUR STORY — PARAGRAPH 1</label>
          <textarea id="c-s1" rows={5} value={form.aboutStory1} onChange={(e) => set({ aboutStory1: e.target.value })} />
        </div>
        <div className="admin-field">
          <label htmlFor="c-s2">OUR STORY — PARAGRAPH 2</label>
          <textarea id="c-s2" rows={5} value={form.aboutStory2} onChange={(e) => set({ aboutStory2: e.target.value })} />
        </div>
      </div>

      <div className="admin-card">
        <h3>Leadership — words from the Director &amp; MD</h3>
        {form.leaders.map((l, idx) => (
          <div key={l.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 0" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* portrait */}
              <div
                className="dropzone"
                style={{ width: 92, height: 92, flexShrink: 0, borderRadius: "50%", padding: 0, overflow: "hidden" }}
                onClick={() => fileRefs.current[idx]?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop(idx)}
                title="Click or drop a portrait photo"
              >
                {l.image ? (
                  <img src={l.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ fontSize: 11, textAlign: "center", padding: 8 }}>
                    {uploadIdx === idx ? "Uploading…" : "Portrait"}
                  </div>
                )}
              </div>
              <input
                ref={(el) => {
                  fileRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileInput(idx)}
              />

              <div style={{ flex: 1 }}>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label>ROLE</label>
                    <input value={l.role} onChange={(e) => setLeader(idx, { role: e.target.value })} placeholder="Director" />
                  </div>
                  <div className="admin-field">
                    <label>NEPALI ROLE</label>
                    <input
                      value={l.nepaliRole}
                      onChange={(e) => setLeader(idx, { nepaliRole: e.target.value })}
                      placeholder="निर्देशक"
                    />
                  </div>
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label>NAME / ORGANISATION</label>
                    <input value={l.name} onChange={(e) => setLeader(idx, { name: e.target.value })} />
                  </div>
                  <div className="admin-field">
                    <label>INITIALS (shown when no photo)</label>
                    <input maxLength={3} value={l.initials} onChange={(e) => setLeader(idx, { initials: e.target.value })} />
                  </div>
                </div>
                <div className="admin-field">
                  <label>MESSAGE</label>
                  <textarea
                    rows={7}
                    value={l.message}
                    onChange={(e) => setLeader(idx, { message: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {l.image && (
                    <button
                      className="admin-btn small"
                      onClick={() => setLeader(idx, { image: undefined, imageStorageId: undefined })}
                    >
                      Remove photo
                    </button>
                  )}
                  <button className="admin-btn small danger" onClick={() => removeLeader(idx)}>
                    Remove card
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button className="admin-btn" onClick={addLeader}>
          + Add leadership card
        </button>
      </div>
    </>
  );
}
