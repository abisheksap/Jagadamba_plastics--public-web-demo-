import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { changePasscodeAnywhere, localAdminOps } from "../data/backend";
import { useBackendMode, useSiteData } from "../data/SiteDataProvider";
import { THEMES } from "../data/themes";
import * as store from "../data/store";
import type { SiteSettings } from "../data/types";

export default function AdminSettings() {
  const { settings, products, gallery, reviews, enquiries } = useSiteData();
  const backendMode = useBackendMode();
  const [form, setForm] = useState<SiteSettings>({ ...settings });
  const [savedMsg, setSavedMsg] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const importRef = useRef<HTMLInputElement | null>(null);

  const onSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (backendMode === "convex") {
        const { convexAdminOps } = await import("../data/backend");
        const { adminCredential } = await import("../data/adminAuth");
        await convexAdminOps(adminCredential()).updateSettings(form);
      } else {
        await localAdminOps.updateSettings(form);
      }
      setSavedMsg("Saved — the website updates immediately.");
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : "Save failed");
    }
    setTimeout(() => setSavedMsg(""), 3500);
  };

  const onChangePw = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await changePasscodeAnywhere(currentPw, nextPw);
    if (ok) {
      setPwMsg("Passcode updated.");
      setCurrentPw("");
      setNextPw("");
    } else {
      setPwMsg("Failed — current passcode wrong, or new one is under 6 characters.");
    }
    setTimeout(() => setPwMsg(""), 3500);
  };

  /** Build a full JSON snapshot from the live model (works in both modes). */
  const snapshotJson = () =>
    JSON.stringify(
      { products, gallery, reviews, enquiries, settings },
      null,
      2,
    );

  const onExport = () => {
    const blob = new Blob([backendMode === "convex" ? snapshotJson() : store.exportData()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jagadamba-site-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = store.importData(String(reader.result));
      window.alert(
        ok
          ? "Backup restored."
          : "That file isn't a valid site backup."
      );
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Contact details, admin passcode and site data backups.</div>
        </div>
      </header>

      <div className="admin-card">
        <h3>Backend</h3>
        {backendMode === "convex" ? (
          <p style={{ fontSize: 13.5, color: "#7dd4a8" }}>
            ✓ Connected to Convex — products, reviews, enquiries and uploads are shared across all
            devices and staff in real time.
          </p>
        ) : (
          <p style={{ fontSize: 13.5, color: "#f0b45c" }}>
            ⚠ Local mode — content lives only in this browser. Export a backup regularly and restore
            it on other devices, or connect Convex in project settings to share everything live.
          </p>
        )}
      </div>

      <div className="admin-card">
        <h3>Appearance — site theme</h3>
        <p className="pill-note" style={{ marginBottom: 12 }}>
          Applies to the whole website instantly. Saved with your settings.
        </p>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-option${(form.theme ?? "deep-ocean") === t.id ? " active" : ""}`}
              onClick={() => setForm({ ...form, theme: t.id })}
            >
              <span className="sw" aria-hidden="true">
                <i style={{ background: t.swatch.bg }} />
                <i style={{ background: t.swatch.accent }} />
                <i style={{ background: t.swatch.cta }} />
              </span>
              <span>
                <span className="t-name">{t.name}</span>
                <span className="t-desc" style={{ display: "block" }}>
                  {t.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3>Contact details (shown site-wide)</h3>
        <form onSubmit={onSaveSettings}>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="s-phone">PHONE</label>
              <input id="s-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="admin-field">
              <label htmlFor="s-email">EMAIL</label>
              <input id="s-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="s-addr">ADDRESS</label>
            <input id="s-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="s-fb">FACEBOOK URL</label>
              <input id="s-fb" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
            </div>
            <div className="admin-field">
              <label htmlFor="s-yt">YOUTUBE URL</label>
              <input id="s-yt" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
            </div>
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="s-pld">PRICE LIST EFFECTIVE DATE (shown above price tables)</label>
              <input
                id="s-pld"
                value={form.priceListDate ?? ""}
                onChange={(e) => setForm({ ...form, priceListDate: e.target.value })}
                placeholder="e.g. 2082/09/01"
              />
            </div>
            <div className="admin-field">
              <label>PRICING VISIBILITY</label>
              <label className={`admin-toggle${form.showPrices !== false ? " on" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.showPrices !== false}
                  onChange={(e) => setForm({ ...form, showPrices: e.target.checked })}
                />
                <span>
                  <span className="t-title">Show prices on the website</span>
                  <span className="t-sub" style={{ display: "block" }}>
                    Off = visitors see sizes but no rates, and are invited to call.
                  </span>
                </span>
              </label>
            </div>
          </div>
          <button className="admin-btn primary" type="submit">
            Save changes
          </button>{" "}
          <span style={{ fontSize: 13, color: "#7dd4a8", marginLeft: 10 }}>{savedMsg}</span>
        </form>
      </div>

      <div className="admin-card">
        <h3>Change admin passcode</h3>
        <form onSubmit={onChangePw}>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="pw-cur">CURRENT PASSCODE</label>
              <input id="pw-cur" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="pw-new">NEW PASSCODE (min 6 chars)</label>
              <input id="pw-new" type="password" value={nextPw} onChange={(e) => setNextPw(e.target.value)} />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Update passcode
          </button>{" "}
          <span style={{ fontSize: 13, color: "#7f93a3", marginLeft: 10 }}>{pwMsg}</span>
        </form>
      </div>

      <div className="admin-card">
        <h3>Site data</h3>
        {backendMode === "convex" ? (
          <p style={{ fontSize: 13.5, color: "#7f93a3", marginBottom: 16 }}>
            Content is centralized in Convex. Download a JSON snapshot anytime for safekeeping.
          </p>
        ) : (
          <p style={{ fontSize: 13.5, color: "#7f93a3", marginBottom: 16 }}>
            Products, gallery, reviews and enquiries live in this browser's storage. Export a backup
            regularly, and restore it on any other device to carry your content over.
          </p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="admin-btn primary" onClick={onExport}>
            {backendMode === "convex" ? "Download snapshot (JSON)" : "Export backup (JSON)"}
          </button>
          {backendMode === "local" && (
            <>
              <button className="admin-btn" onClick={() => importRef.current?.click()}>
                Import backup
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={onImportFile}
              />
              <button
                className="admin-btn danger"
                onClick={() => {
                  if (confirm("Reset everything back to the original seed content? Custom products, gallery items, reviews and enquiries will be lost.")) {
                    store.resetToSeed();
                  }
                }}
              >
                Reset to defaults
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
