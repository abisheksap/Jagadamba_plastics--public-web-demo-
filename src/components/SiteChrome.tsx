import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { PUBLIC_THEME_EVENT, setPublicThemePreference } from "../data/theme";

export function TopBar({ phone, email, phoneAlt }: { phone: string; email: string; phoneAlt?: string }) {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute("data-theme") === "jagadamba-dark");

  useEffect(() => {
    const syncTheme = () => setDarkMode(document.documentElement.getAttribute("data-theme") === "jagadamba-dark");
    window.addEventListener(PUBLIC_THEME_EVENT, syncTheme);
    return () => window.removeEventListener(PUBLIC_THEME_EVENT, syncTheme);
  }, []);

  const toggleDarkMode = () => {
    const nextDarkMode = !darkMode;
    setPublicThemePreference(nextDarkMode ? "jagadamba-dark" : "heritage-cream");
    setDarkMode(nextDarkMode);
  };

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <Link to="/" aria-label="Jagadamba Plastic home"><img src="/images/logo.png" alt="" /></Link>
        <span><b>JAGADAMBA</b><small>PLASTIC INDUSTRIES PVT. LTD.</small></span>
      </div>
      <div className="topbar-status" aria-label="Company details">
        <span>BHARATPUR-4 · CHITWAN</span>
        <i aria-hidden="true" />
        <span>PIPES · FITTINGS · TANKS</span>
        <span className="scroll-readout" id="scrollReadout">SCROLL 00%</span>
      </div>
      <div className="topbar-info">
        <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>☎ {phone}</a>
        {phoneAlt && <a href={`tel:${phoneAlt.replace(/[^+\d]/g, "")}`}>☎ {phoneAlt}</a>}
        <a href={`mailto:${email}`}>{email}</a>
        <span>www.jagadambaplastic.com</span>
        <button className="theme-toggle" type="button" onClick={toggleDarkMode} aria-pressed={darkMode} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          <span aria-hidden="true">{darkMode ? "☼" : "◐"}</span>
          <b>{darkMode ? "Light" : "Dark"}</b>
        </button>
      </div>
    </div>
  );
}

export function ScrollTrack() {
  useEffect(() => {
    const progress = document.getElementById("scrollProgress");
    const readout = document.getElementById("scrollReadout");
    const nav = document.getElementById("nav");
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
      nav?.classList.toggle("scrolled", y > 30);
      if (progress) progress.style.width = `${ratio * 100}%`;
      if (readout) readout.textContent = `SCROLL ${String(Math.round(ratio * 100)).padStart(2, "0")}%`;
      document.documentElement.style.setProperty("--scroll-ratio", `${ratio}`);
      ticking = false;
    };
    const onScrollRequest = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    };
    window.addEventListener("scroll", onScrollRequest, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScrollRequest);
  }, []);

  return (
    <>
      <div className="scroll-track" />
      <div className="scroll-progress" id="scrollProgress" />
    </>
  );
}

function messengerUrl(facebook: string): string {
  try {
    const page = new URL(facebook).pathname.split("/").filter(Boolean).pop();
    return page ? `https://m.me/${page}` : "https://www.facebook.com/messenger";
  } catch {
    return "https://www.facebook.com/messenger";
  }
}

export function MessageButton({ facebook }: { facebook: string }) {
  return (
    <a
      className="message-button"
      href={messengerUrl(facebook)}
      target="_blank"
      rel="noreferrer"
      aria-label="Message Jagadamba Plastic on Messenger"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11.5a8 8 0 0 1-8 8 8.8 8.8 0 0 1-3.6-.8L4 20l1.3-3.8A7.7 7.7 0 0 1 4 11.5a8 8 0 0 1 16 0Z" />
        <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
      </svg>
      <span>Message us</span>
    </a>
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
