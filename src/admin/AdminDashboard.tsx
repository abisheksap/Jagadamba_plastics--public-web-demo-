import { Link } from "react-router-dom";
import { useSiteData } from "../data/SiteDataProvider";

export default function AdminDashboard() {
  const data = useSiteData();
  const pendingReviews = data.reviews.filter((r) => r.status === "pending");
  const newEnquiries = data.enquiries.filter((e) => e.status === "new");
  const variantTotal = data.products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);
  const totalProducts = data.products.length;

  const cards = [
    { label: "Products live", num: totalProducts, to: "/admin/products" },
    { label: "Size / rate variants", num: variantTotal, to: "/admin/products" },
    { label: "Gallery items", num: data.gallery.length, to: "/admin/gallery" },
    { label: "Reviews awaiting approval", num: pendingReviews.length, to: "/admin/reviews" },
    { label: "New enquiries", num: newEnquiries.length, to: "/admin/enquiries" },
  ];

  return (
    <>
      <header className="admin-head">
        <div className="admin-head-logo">
          <img src="/images/logo.png" alt="Jagadamba" /> Jagadamba Admin
        </div>
        <h1>Dashboard</h1>
        <div className="admin-head-sub">Everything the public site shows is managed from here.</div>
      </header>

      <div className="stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <div className="stat-card-future">
              <div className="num-future">{c.num}</div>
              <div className="lbl-future">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {(pendingReviews.length > 0 || newEnquiries.length > 0) && (
        <div className="admin-card admin-card-attention">
          <h3>Needs your attention</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>FROM</th>
                  <th>WHEN</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line-light)", transition: "background 0.2s ease" }}>
                    <td>
                      <span className="badge pending">REVIEW</span> {"★".repeat(r.rating)} — {r.quote.slice(0, 60)}
                      {r.quote.length > 60 ? "…" : ""}
                    </td>
                    <td>{r.name}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to="/admin/reviews" className="admin-btn-small">Moderate →</Link>
                    </td>
                  </tr>
                ))}
                {newEnquiries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--line-light)", transition: "background 0.2s ease" }}>
                    <td>
                      <span className="badge new">ENQUIRY</span> {e.interest}
                    </td>
                    <td>{e.name} · {e.phone}</td>
                    <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to="/admin/enquiries" className="admin-btn-small">Open inbox →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-card admin-card-callout">
        <div>
          <span className="admin-side-callout-kicker">HOMEPAGE DESIGNER</span>
          <h3>Shape the first product impression</h3>
          <p>Open the visual arranger to place, resize and layer the products in the homepage hero group.</p>
        </div>
        <Link to="/admin/arranger" className="admin-btn-primary">Open designer →</Link>
      </div>

      <div className="admin-card">
        <h3>Quick actions</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/admin/products" className="admin-btn">Add a product</Link>
          <Link to="/admin/arranger" className="admin-btn">Open homepage designer</Link>
          <Link to="/admin/content" className="admin-btn">Edit hero & leadership content</Link>
          <Link to="/admin/gallery" className="admin-btn">Upload gallery photo</Link>
          <Link to="/admin/activity" className="admin-btn">View activity log</Link>
          <Link to="/admin/settings" className="admin-btn">Edit contact details</Link>
        </div>
      </div>
    </>
  );
}
