import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: "72vh", display: "flex", alignItems: "center" }}>
      <div className="wrap">
        <div className="kicker" style={{ color: "var(--accent-light)" }}>
          <span className="rule" style={{ background: "linear-gradient(90deg,var(--accent-light),#EEF1EC 50%,var(--accent-light))" }} />
          404
        </div>
        <h1>This pipe leads nowhere.</h1>
        <p className="sub">The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ marginTop: 30, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link to="/" className="btn btn-primary">
            Back home
          </Link>
          <Link to="/products" className="btn btn-ghost">
            Browse products
          </Link>
        </div>
      </div>
    </section>
  );
}
