import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSiteData } from "../data/SiteDataProvider";
import { PRODUCT_GROUPS, productGroupFor } from "../data/types";
import { useQuote } from "../data/QuoteProvider";

/* ---------- small inline icons (no emoji glyphs, so they render identically everywhere) ---------- */
type IconProps = { size?: number };
const svgProps = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const, focusable: false as const });
const ArrowUpRight = ({ size = 15 }: IconProps) => <svg {...svgProps(size)}><path d="M7 17 17 7M8 7h9v9" /></svg>;
const ChevronDown = ({ size = 14 }: IconProps) => <svg {...svgProps(size)}><path d="m6 9 6 6 6-6" /></svg>;
const SearchIcon = ({ size = 18 }: IconProps) => <svg {...svgProps(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
const PhoneIcon = ({ size = 16 }: IconProps) => <svg {...svgProps(size)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>;
const PinIcon = ({ size = 14 }: IconProps) => <svg {...svgProps(size)}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const MailIcon = ({ size = 14 }: IconProps) => <svg {...svgProps(size)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;

const ListIcon = ({ size = 18 }: IconProps) => <svg {...svgProps(size)}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>;

const FacebookIcon = ({ size = 15 }: IconProps) => <svg {...svgProps(size)}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" /></svg>;
const YoutubeIcon = ({ size = 16 }: IconProps) => <svg {...svgProps(size)}><rect x="3" y="6" width="18" height="12" rx="4" /><path d="m10.5 9.5 4 2.5-4 2.5Z" /></svg>;

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

/**
 * The small logo in the header/footer: the same layered animation as the loading screen
 * (ring sweeps in, letters rise, flame lights and flickers), compact and without the wordmark.
 */
function LogoMark({ size = 40, lazy = false }: { size?: number; lazy?: boolean }) {
  const attrs = { loading: lazy ? ("lazy" as const) : ("eager" as const), decoding: "async" as const };
  return (
    <span className="logo-mark" style={{ ["--lm" as string]: `${size}px` }} aria-hidden="true">
      <img className="lm-ring" {...attrs} src="/images/loader/ring.png" alt="" width={489} height={561} />
      <img className="lm-letters" {...attrs} src="/images/loader/letters.png" alt="" width={489} height={561} />
      <span className="lm-glow" />
      <img className="lm-flame" {...attrs} src="/images/loader/flame.png" alt="" width={489} height={561} />
    </span>
  );
}

/* ---------- scroll progress + header "scrolled" state ---------- */
export function ScrollTrack() {
  useEffect(() => {
    const progress = document.getElementById("scrollProgress");
    const header = document.getElementById("siteHeader");
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
      header?.classList.toggle("is-scrolled", y > 24);
      if (progress) progress.style.width = `${ratio * 100}%`;
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

  return <><div className="scroll-track" /><div className="scroll-progress" id="scrollProgress" /></>;
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
    <a className="message-button" href={messengerUrl(facebook)} target="_blank" rel="noreferrer" aria-label="Message Jagadamba Plastic on Messenger">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8 8.8 8.8 0 0 1-3.6-.8L4 20l1.3-3.8A7.7 7.7 0 0 1 4 11.5a8 8 0 0 1 16 0Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg>
      <span>Message us</span>
    </a>
  );
}

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
];

/**
 * One fixed header = slim contact strip (desktop) + main bar.
 * Heights come from CSS variables (--sx-strip-h / --sx-bar-h / --header-h), so page content
 * pads itself with var(--header-h) instead of hand-tuned pixel offsets.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [flyout, setFlyout] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 960px)").matches);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const quote = useQuote();
  const { settings, content, products } = useSiteData();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const groupImage = (groupId: string) =>
    (products.find((p) => p.featured && productGroupFor(p.category).id === groupId) ?? products.find((p) => productGroupFor(p.category).id === groupId))?.image;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const brandName = content.brandDisplayName ?? "Jagadamba Plastic";

  useEffect(() => { setOpen(false); setFlyout(false); setSearchOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 960px)");
    const update = () => { setIsMobile(media.matches); if (!media.matches) setOpen(false); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [isMobile, open]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setFlyout(false);
      setSearchOpen(false);
      if (open) setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchInputRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [searchOpen]);

  const searchResults = (() => {
    const q = searchText.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => `${p.name} ${p.tagline} ${p.category} ${(p.variants ?? []).map((v) => v.size).join(" ")}`.toLowerCase().includes(q))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 6);
  })();
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    setSearchOpen(false);
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  const trapFocus = (event: React.KeyboardEvent) => {
    if (!open || event.key !== "Tab") return;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => `sx-link${isActive ? " is-active" : ""}`;

  return (
    <header className="sx-header" id="siteHeader">
      <div className="sx-strip">
        <div className="sx-wrap sx-strip-inner">
          <div className="sx-strip-contact" aria-label="Contact details">
            <a href={telHref(settings.phone)}><PhoneIcon size={14} /> {settings.phone}</a>
            <a href={`mailto:${settings.email}`}><MailIcon /> {settings.email}</a>
          </div>
          <div className="sx-strip-contact">
            <span><PinIcon /> {settings.address}</span>
            <span className="sx-strip-social">
              <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Jagadamba Plastic on Facebook"><FacebookIcon /></a>
              <a href={settings.youtube} target="_blank" rel="noreferrer" aria-label="Jagadamba Plastic on YouTube"><YoutubeIcon /></a>
            </span>
            <span lang="ne" className="sx-strip-ne">नेपालमा बनेको</span>
          </div>
        </div>
      </div>

      <div className="sx-bar">
        <div className="sx-wrap sx-bar-inner">
          <Link to="/" className="sx-brand" aria-label={`${brandName} home`}>
            <span className="sx-brand-mark"><LogoMark size={38} /></span>
            <span className="sx-brand-text">
              <span className="sx-brand-name">{brandName}</span>
              <span className="sx-brand-sub">{content.brandTagline ?? "Pipes · Fittings · Tanks"}</span>
            </span>
          </Link>

          <nav className="sx-nav" aria-label="Primary" onMouseLeave={() => setFlyout(false)}>
            <NavLink to="/about" className={linkClass}>About</NavLink>
            <div className="sx-has-flyout" onMouseEnter={() => setFlyout(true)} onFocus={() => setFlyout(true)}>
              <NavLink to="/products" className={linkClass} aria-haspopup="true" aria-expanded={flyout}>Products <ChevronDown size={14} /></NavLink>
              {flyout && (
                <div className="sx-flyout">
                  <div className="sx-flyout-kicker">Shop by system</div>
                  {PRODUCT_GROUPS.map((group) => (
                    <Link key={group.id} to={`/products?group=${group.id}`} className={`sx-flyout-item sx-flyout-${group.accent}`}>
                      <span className="sx-flyout-thumb" aria-hidden="true">{groupImage(group.id) && <img src={groupImage(group.id)} alt="" width={56} height={56} loading="lazy" />}</span>
                      <span className="sx-flyout-text"><b>{group.label}</b><small>{group.description}</small></span>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                  <Link to="/products" className="sx-flyout-all">View all {products.length} products <ArrowUpRight size={14} /></Link>
                </div>
              )}
            </div>
            <NavLink to="/gallery" className={linkClass}>Gallery</NavLink>
            <NavLink to="/reviews" className={linkClass}>Reviews</NavLink>
          </nav>

          <div className="sx-actions">
            <button type="button" className="sx-icon-btn sx-search" aria-label="Search products" onClick={() => setSearchOpen(true)}><SearchIcon /></button>
            {quote.items.length > 0 && (
              <Link className="sx-icon-btn sx-quote-count" to="/contact#quote" aria-label={`Quote list, ${quote.items.length} ${quote.items.length === 1 ? "product" : "products"}`}>
                <ListIcon /><b>{quote.items.length}</b>
              </Link>
            )}
            <a className="sx-icon-btn sx-call" href={telHref(settings.phone)} aria-label={`Call ${settings.phone}`}><PhoneIcon size={18} /></a>
            <Link to="/contact" className="sx-cta">Get a quote <ArrowUpRight size={14} /></Link>
            <button ref={menuButtonRef} className="sx-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="sxDrawer" onClick={() => setOpen((v) => !v)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="sx-search-overlay" role="dialog" aria-modal="true" aria-label="Search products" onClick={() => setSearchOpen(false)}>
          <div className="sx-search-panel" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submitSearch} role="search">
              <SearchIcon size={20} />
              <input ref={searchInputRef} type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search pipes, fittings, tanks or sizes (e.g. 110mm)…" aria-label="Search products" autoComplete="off" />
              <button type="button" className="sx-search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">Esc</button>
            </form>
            <ul className="sx-search-results" aria-live="polite">
              {searchText.trim().length < 2 && <li className="sx-search-hint">Type at least two letters, or a size such as “110mm”.</li>}
              {searchText.trim().length >= 2 && searchResults.length === 0 && <li className="sx-search-hint">No products match “{searchText.trim()}”.</li>}
              {searchResults.map((p) => (
                <li key={p.id}>
                  <Link to={`/products/${p.id}`} className="sx-search-item">
                    <img src={p.image} alt="" width={44} height={44} loading="lazy" decoding="async" />
                    <span><b>{p.name}</b><small>{p.category}</small></span>
                    <ArrowUpRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
            {searchText.trim().length >= 2 && (
              <button type="button" className="sx-search-all" onClick={submitSearch as unknown as React.MouseEventHandler}>
                See all results for “{searchText.trim()}” <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* mobile drawer */}
      <div className={`sx-drawer-backdrop${open ? " is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={drawerRef} id="sxDrawer" className={`sx-drawer${open ? " is-open" : ""}`} aria-hidden={isMobile && !open} onKeyDown={trapFocus} {...(isMobile && !open ? { inert: "" as unknown as undefined } : {})}>
        <div className="sx-drawer-head">
          <span>Menu</span>
          <button type="button" className="sx-drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="sx-drawer-links">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
          <NavLink to="/products" end className={linkClass}>All products</NavLink>
        </div>
        <div className="sx-drawer-kicker">Shop by system</div>
        <div className="sx-drawer-groups">
          {PRODUCT_GROUPS.map((group) => (
            <Link key={group.id} to={`/products?group=${group.id}`} className={`sx-drawer-group sx-flyout-${group.accent}`}>
              <span className="sx-drawer-thumb" aria-hidden="true">{groupImage(group.id) && <img src={groupImage(group.id)} alt="" width={56} height={56} loading="lazy" />}</span>
              <b>{group.label}</b><small>{group.eyebrow}</small>
            </Link>
          ))}
        </div>
        <Link to="/contact" className="sx-cta sx-cta-block">Get a quote <ArrowUpRight size={14} /></Link>
        <div className="sx-drawer-contact">
          <a href={telHref(settings.phone)}><PhoneIcon size={15} /> {settings.phone}</a>
          <a href={`mailto:${settings.email}`}><MailIcon size={15} /> {settings.email}</a>
          <span><PinIcon size={15} /> {settings.address}</span>
        </div>
      </div>
    </header>
  );
}

export function Footer({ settings }: { settings: { phone: string; phoneAlt?: string; email: string; address: string; facebook: string; youtube: string } }) {
  const { content } = useSiteData();
  const brandName = content.brandDisplayName ?? "Jagadamba Plastic";
  const companyName = content.companyDisplayName ?? "Jagadamba Plastic Industries Pvt. Ltd.";
  return (
    <footer className="sx-footer">
      <div className="sx-wrap">
        <div className="footer-grid sx-footer-grid">
          <div>
            <div className="brand">
              <Link to="/" aria-label={`${brandName} home`}><LogoMark size={40} lazy /></Link>
              <Link to="/">{brandName}</Link>
            </div>
            <p className="f-moto">HDPE, PVC and CPVC pipes, fittings and water tanks — manufactured in Chitwan and certified to national standard. नेपालमा बनेको।</p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/about">About us</Link>
            <Link to="/products">Product catalog</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/reviews">Customer reviews</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Reach us</h4>
            <a href={telHref(settings.phone)}>{settings.phone}</a>
            {settings.phoneAlt && <a href={telHref(settings.phoneAlt)}>{settings.phoneAlt}</a>}
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <a href={settings.facebook} target="_blank" rel="noreferrer">Facebook</a>
            <a href={settings.youtube} target="_blank" rel="noreferrer">YouTube</a>
            <span className="sx-footer-address">{settings.address}</span>
          </div>
          <div className="sx-footer-location">
            <h4>Our location</h4>
            <iframe
              title={`Map showing ${settings.address}`}
              src="https://www.openstreetmap.org/export/embed.html?bbox=84.415%2C27.673%2C84.442%2C27.699&amp;layer=mapnik&amp;marker=27.686%2C84.428"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <a
              className="sx-footer-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              View in Google Maps <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>www.jagadambaplastic.com · नेपालमा बनेको</span>
          <span>© 2026 {companyName}</span>
        </div>
      </div>
    </footer>
  );
}
