import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export function TopBar({
  phone,
  email,
  phoneAlt,
}: {
  phone: string;
  email: string;
  phoneAlt?: string;
}) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <img src="/images/logo.png" alt="" />
        <span>Jagadamba Plastic Industries Pvt. Ltd. &middot; Bharatpur-4, Chitwan</span>
      </div>
      <div className="topbar-info">
        <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>☎ {phone}</a>
        {phoneAlt && <a href={`tel:${phoneAlt.replace(/[^+\d]/g, "")}`}>☎ {phoneAlt}</a>}
        <a href={`mailto:${email}`}>{email}</a>
        <span>www.jagadambaplastic.com</span>
      </div>
    </div>
  );
}

export function ScrollTrack() {
  useEffect(() => {
    const progress = document.getElementById("scrollProgress");
    const nav = document.getElementById("nav");
    let ticking = false;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      nav?.classList.toggle("scrolled", scrollTop > 30);
      if (progress) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${docH > 0 ? (scrollTop / docH) * 100 : 0}%`;
      }
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(onScroll);
          ticking = true;
        }
      },
      { passive: true },
    );
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="scroll-track" />
      <div className="scroll-progress" id="scrollProgress" />
    </>
  );
}

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Get a quote", className: "nav-cta" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <nav className="nav" id="nav">
      <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
        <span className="mark-wrap">
          <img className="mark" src="/images/logo-legacy.png" alt="Jagadamba Plastic logo" />
        </span>
        <span className="nav-logo-text">
          <span className="nav-logo-name">Jagadamba Plastic</span>
          <span className="nav-logo-sub">Pipes · Fittings · Tanks — नेपालमा बनेको</span>
        </span>
      </Link>
      <div className={`nav-links${open ? " open" : ""}`} id="navLinks">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `${l.className ?? ""} ${isActive ? "active" : ""}`.trim()}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}

export function Footer({
  settings,
}: {
  settings: {
    phone: string;
    phoneAlt?: string;
    email: string;
    address: string;
    facebook: string;
    youtube: string;
  };
}) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <img src="/images/logo.png" alt="" />
              Jagadamba Plastic
            </div>
            <p className="f-moto">
              HDPE, PVC and CPVC pipes, fittings and water tanks — manufactured in Chitwan and
              certified to national standard. नेपालमा बनेको।
            </p>
          </div>
          <div>
            <h4>EXPLORE</h4>
            <Link to="/about">About us</Link>
            <Link to="/products">Product catalog</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/reviews">Customer reviews</Link>
          </div>
          <div>
            <h4>REACH US</h4>
            <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>{settings.phone}</a>
            {settings.phoneAlt && (
              <a href={`tel:${settings.phoneAlt.replace(/[^+\d]/g, "")}`}>{settings.phoneAlt}</a>
            )}
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <a href={settings.facebook} target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href={settings.youtube} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <span style={{ display: "block", color: "var(--text-dim)", fontSize: 13.5, padding: "5px 0" }}>
              {settings.address}
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>www.jagadambaplastic.com · नेपालमा बनेको</span>
          <span>
            © 2026 Jagadamba Plastic Industries Pvt. Ltd. · <Link to="/admin">Admin</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
