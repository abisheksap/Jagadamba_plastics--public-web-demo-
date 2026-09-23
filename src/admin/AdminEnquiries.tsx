import { useState } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";

export default function AdminEnquiries() {
  const { enquiries } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [error, setError] = useState("");
  const open = enquiries.filter((e) => e.status !== "archived");
  const archived = enquiries.filter((e) => e.status === "archived");

  const run = (fn: () => Promise<void>) => {
    fn().catch((err) => setError(err instanceof Error ? err.message : "Action failed"));
  };

  const Row = ({ e, archivedRow }: { e: (typeof enquiries)[number]; archivedRow?: boolean }) => (
    <tr>
      <td style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ color: "#fff" }}>{e.name}</strong>
          <span className={`badge ${e.status}`}>{e.status.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 13, color: "#7f93a3", marginTop: 3 }}>
          Interested in <span style={{ color: "#cfd9df" }}>{e.interest}</span>
        </div>
        {e.message && <div style={{ marginTop: 6, fontSize: 13.5 }}>{e.message}</div>}
      </td>
      <td>
        <a href={`tel:${e.phone.replace(/[^+\d]/g, "")}`} style={{ color: "#8fe3ef" }}>
          {e.phone}
        </a>
      </td>
      <td className="mono">{new Date(e.createdAt).toLocaleDateString()}</td>
      <td>
        <div className="row-actions">
          {!archivedRow && e.status === "new" && (
            <button className="admin-btn small" onClick={() => run(() => ops.setEnquiryStatus(e.id, "read"))}>
              Mark read
            </button>
          )}
          {!archivedRow && (
            <button className="admin-btn small" onClick={() => run(() => ops.setEnquiryStatus(e.id, "archived"))}>
              Archive
            </button>
          )}
          {archivedRow && (
            <button className="admin-btn small" onClick={() => run(() => ops.setEnquiryStatus(e.id, "new"))}>
              Restore
            </button>
          )}
          <button
            className="admin-btn small danger"
            onClick={() => {
              if (confirm("Delete this enquiry permanently?")) run(() => ops.deleteEnquiry(e.id));
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Enquiries</h1>
          <div className="sub">
            {open.filter((e) => e.status === "new").length} new · {open.length} open · {archived.length}{" "}
            archived
          </div>
        </div>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}

      <div className="admin-card">
        <h3>Inbox</h3>
        {open.length === 0 ? (
          <div className="empty-state">No enquiries yet — submissions from the contact form land here.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ENQUIRY</th>
                  <th>PHONE</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {open.map((e) => (
                  <Row key={e.id} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <div className="admin-card">
          <h3>Archived</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ENQUIRY</th>
                  <th>PHONE</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((e) => (
                  <Row key={e.id} e={e} archivedRow />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
