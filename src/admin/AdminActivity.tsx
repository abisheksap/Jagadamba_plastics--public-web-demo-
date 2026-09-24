import { useEffect, useMemo, useState } from "react";
import { fetchActivity } from "../data/backend";
import type { ActivityEntry, ActivityKind } from "../data/types";

const KIND_ICON: Record<ActivityKind, string> = {
  product: "📦",
  gallery: "🖼️",
  review: "★",
  enquiry: "✉",
  content: "✎",
  settings: "⚙",
  layout: "◎",
  admin: "🔑",
  theme: "◐",
};

const FILTERS: Array<{ id: "all" | ActivityKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "product", label: "Products" },
  { id: "enquiry", label: "Enquiries" },
  { id: "review", label: "Reviews" },
  { id: "content", label: "Content" },
  { id: "gallery", label: "Gallery" },
  { id: "layout", label: "Home group" },
  { id: "settings", label: "Settings" },
  { id: "theme", label: "Theme" },
  { id: "admin", label: "Admin" },
];

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AdminActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");

  useEffect(() => {
    let live = true;
    const load = async () => {
      const rows = await fetchActivity();
      if (live) {
        setEntries(rows);
        setLoading(false);
      }
    };
    void load();
    const t = setInterval(load, 15000); // keep the log fresh (new enquiries etc.)
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  const shown = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.kind === filter)),
    [entries, filter],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<ActivityKind, number>> = {};
    for (const e of entries) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [entries]);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Activity log</h1>
          <div className="sub">
            Every change across the site — admin edits, arrangement saves and incoming enquiries/reviews.
          </div>
        </div>
      </header>

      <div className="admin-card">
        <div className="admin-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-pill${filter === f.id ? " active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id !== "all" && counts[f.id] ? ` (${counts[f.id]})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading activity…</div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            Nothing logged yet {filter !== "all" ? `under “${filter}”` : ""}.
          </div>
        ) : (
          <div>
            {shown.map((e) => (
              <div key={e.id} className="act-row">
                <span className={`act-ico act-kind-${e.kind}`} aria-hidden="true">
                  {KIND_ICON[e.kind] ?? "•"}
                </span>
                <div className="act-body">
                  <div className="act-summary">
                    {e.summary}
                    {!e.byAdmin && (
                      <span className="badge new" style={{ marginLeft: 8 }}>
                        PUBLIC FORM
                      </span>
                    )}
                  </div>
                  {e.detail && <div className="act-detail">{e.detail}</div>}
                </div>
                <span className="act-time" title={new Date(e.createdAt).toLocaleString()}>
                  {timeAgo(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
