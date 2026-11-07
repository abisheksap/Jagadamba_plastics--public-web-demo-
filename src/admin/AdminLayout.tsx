import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../data/adminAuth";

const NAV = [
  { to: "/auth/admin-services/admin", label: "Dashboard", end: true },
  { to: "/auth/admin-services/admin/products", label: "Products" },
  { to: "/auth/admin-services/admin/arranger", label: "Homepage designer" },
  { to: "/auth/admin-services/admin/content", label: "Content" },
  { to: "/auth/admin-services/admin/gallery", label: "Gallery" },
  { to: "/auth/admin-services/admin/documents", label: "Documents" },
  { to: "/auth/admin-services/admin/reviews", label: "Reviews" },
  { to: "/auth/admin-services/admin/enquiries", label: "Enquiries" },
  { to: "/auth/admin-services/admin/activity", label: "Activity log" },
  { to: "/auth/admin-services/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const onSignOut = () => {
    signOut();
    navigate("/auth/admin-services/admin", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-side${open ? " open" : ""}`}>
        <div className="brand">
          <img loading="lazy" decoding="async" src="/images/logo.png" alt="" />
          Jagadamba Admin
        </div>
        <div className="side-label">DESIGN & MANAGE</div>
        <Link to="/auth/admin-services/admin/arranger" className="admin-side-callout">
          <span className="admin-side-callout-kicker">HOMEPAGE DESIGNER</span>
          <strong>Arrange the product group</strong>
          <span>Drag, resize and place the hero products →</span>
        </Link>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {n.label}
          </NavLink>
        ))}
        <div className="side-foot">
          <Link to="/" className="admin-btn" style={{ textAlign: "center" }}>
            View website ↗
          </Link>
          <button className="admin-btn danger" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <button className="admin-burger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          ☰ Menu
        </button>
        {children}
      </main>
    </div>
  );
}
