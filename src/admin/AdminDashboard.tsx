import { Link } from "react-router-dom";
import { useSiteData } from "../data/SiteDataProvider";
import { DEALERS } from "../data/dealers";
import { downloadCsv } from "../data/csv";

export default function AdminDashboard() {
  const data = useSiteData();
  const pendingReviews = data.reviews.filter((r) => r.status === "pending");
  const newEnquiries = data.enquiries.filter((e) => e.status === "new");
  const variantTotal = data.products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);
  const totalProducts = data.products.length;

  const exportDealers = () => {
    downloadCsv(
      `dealers-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Province", "District", "Phone", "Address"],
      DEALERS.map((dealer) => [dealer.name, dealer.province, dealer.district, dealer.phone, dealer.address ?? ""]),
    );
  };

  const cards = [
    { label: "Products live", num: totalProducts, to: "/auth/admin-services/admin/products" },
    { label: "Size / rate variants", num: variantTotal, to: "/auth/admin-services/admin/products" },
    { label: "Gallery items", num: data.gallery.length, to: "/auth/admin-services/admin/gallery" },
    { label: "Documents shown", num: (data.documents ?? []).length, to: "/auth/admin-services/admin/documents" },
    { label: "Reviews awaiting approval", num: pendingReviews.length, to: "/auth/admin-services/admin/reviews" },
    { label: "New enquiries", num: newEnquiries.length, to: "/auth/admin-services/admin/enquiries" },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-head">
        <div className="admin-head-logo">
          <img loading="lazy" decoding="async" src="/images/logo.png" alt="Jagadamba" /> Jagadamba Admin
        </div>
        <h1>Dashboard</h1>
        <div className="admin-head-sub">Welcome! Manage your website content, products, and enquiries from here.</div>
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
                      <Link to="/auth/admin-services/admin/reviews" className="admin-btn-small">Moderate →</Link>
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
                      <Link to="/auth/admin-services/admin/enquiries" className="admin-btn-small">Open inbox →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-card admin-designer-callout">
        <div>
          <span className="admin-side-callout-kicker">HOMEPAGE DESIGNER</span>
          <h3>Shape the first product impression</h3>
          <p>Open the visual arranger to place, resize and layer the products in the homepage hero group.</p>
        </div>
        <Link to="/auth/admin-services/admin/arranger" className="admin-btn-primary">Open designer →</Link>
      </div>

      <div className="admin-card">
        <h3>Quick actions</h3>
        <p style={{ marginBottom: 14, color: "var(--text-dim)", fontSize: 13.5 }}>Common tasks to update your website quickly.</p>
        <div className="admin-quick-actions">
          <Link to="/auth/admin-services/admin/products" className="admin-btn">Add/edit products</Link>
          <Link to="/auth/admin-services/admin/arranger" className="admin-btn">Arrange homepage products</Link>
          <Link to="/auth/admin-services/admin/content" className="admin-btn">Edit homepage text</Link>
          <Link to="/auth/admin-services/admin/gallery" className="admin-btn">Manage gallery</Link>
          <Link to="/auth/admin-services/admin/documents" className="admin-btn">Manage documents</Link>
          <Link to="/auth/admin-services/admin/reviews" className="admin-btn">Moderate reviews</Link>
          <Link to="/auth/admin-services/admin/enquiries" className="admin-btn">View enquiries</Link>
          <button className="admin-btn" type="button" onClick={exportDealers} disabled={DEALERS.length === 0}>Export dealers CSV</button>
          <Link to="/auth/admin-services/admin/settings" className="admin-btn">Site settings & theme</Link>
          <Link to="/auth/admin-services/admin/activity" className="admin-btn">Activity log</Link>
        </div>
      </div>
    </div>
  );
}
