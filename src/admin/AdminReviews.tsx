import { useState } from "react";
import { adminCredential } from "../data/adminAuth";
import { useAdminOps, useSiteData } from "../data/SiteDataProvider";

export default function AdminReviews() {
  const { reviews } = useSiteData();
  const ops = useAdminOps(adminCredential());
  const [error, setError] = useState("");
  const pending = reviews.filter((r) => r.status === "pending");
  const decided = reviews.filter((r) => r.status !== "pending");

  const run = (fn: () => Promise<void>) => {
    fn().catch((err) => setError(err instanceof Error ? err.message : "Action failed"));
  };

  const Actions = ({ id, status }: { id: string; status: string }) => (
    <div className="row-actions">
      <button className="admin-btn small primary" onClick={() => run(() => ops.setReviewStatus(id, "approved"))}>
        Approve
      </button>
      <button className="admin-btn small" onClick={() => run(() => ops.setReviewStatus(id, "rejected"))}>
        Reject
      </button>
      <button
        className="admin-btn small danger"
        onClick={() => {
          if (confirm("Delete this review permanently?")) run(() => ops.deleteReview(id));
        }}
      >
        Delete
      </button>
      {status && null}
    </div>
  );

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Customer reviews</h1>
          <div className="sub">
            {pending.length} awaiting approval · {reviews.filter((r) => r.status === "approved").length}{" "}
            published on the site
          </div>
        </div>
      </header>

      {error && (
        <div className="admin-card" style={{ borderColor: "#e02129" }}>
          <span style={{ color: "#ff8a8f" }}>{error}</span>
        </div>
      )}

      <div className="admin-card">
        <h3>Awaiting approval</h3>
        {pending.length === 0 ? (
          <div className="empty-state">No pending reviews — you're all caught up.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REVIEW</th>
                  <th>FROM</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td style={{ maxWidth: 380 }}>
                      <span className="test-stars" style={{ color: "#ffd166", fontSize: 12 }}>
                        {"★".repeat(r.rating)}
                      </span>
                      <div style={{ marginTop: 4 }}>“{r.quote}”</div>
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{r.name}</strong>
                      {r.business && <div style={{ fontSize: 12.5, color: "#7f93a3" }}>{r.business}</div>}
                    </td>
                    <td className="mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Actions id={r.id} status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3>Approved &amp; rejected</h3>
        {decided.length === 0 ? (
          <div className="empty-state">Nothing here yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REVIEW</th>
                  <th>FROM</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((r) => (
                  <tr key={r.id}>
                    <td style={{ maxWidth: 380 }}>
                      <span className="test-stars" style={{ color: "#ffd166", fontSize: 12 }}>
                        {"★".repeat(r.rating)}
                      </span>
                      <div style={{ marginTop: 4 }}>“{r.quote}”</div>
                    </td>
                    <td>{r.name}</td>
                    <td>
                      <span className={`badge ${r.status}`}>{r.status.toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {r.status === "rejected" && (
                          <button className="admin-btn small primary" onClick={() => run(() => ops.setReviewStatus(r.id, "approved"))}>
                            Approve
                          </button>
                        )}
                        {r.status === "approved" && (
                          <button className="admin-btn small" onClick={() => run(() => ops.setReviewStatus(r.id, "rejected"))}>
                            Unpublish
                          </button>
                        )}
                        <button
                          className="admin-btn small danger"
                          onClick={() => {
                            if (confirm("Delete this review permanently?")) run(() => ops.deleteReview(r.id));
                          }}
                        >
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
