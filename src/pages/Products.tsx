import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EnquiryForm } from "../components/EnquiryForm";
import { useSiteData } from "../data/SiteDataProvider";
import type { Product, ProductVariant } from "../data/types";
import { PRODUCT_CATEGORIES } from "../data/types";

const ArrowIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="3.2" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <path d="M6 12h8M11.5 7.2 17.5 12l-6 4.8" />
  </svg>
);

const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

export function formatPrice(n: number): string {
  return `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })}`;
}

function fromPrice(p: Product, showPrices: boolean): string | null {
  if (!showPrices) return null;
  const prices = (p.variants ?? []).map((v) => v.price).filter((x): x is number => typeof x === "number");
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  return `From ${formatPrice(min)}`;
}

function variantLabel(v: ProductVariant): string {
  return v.spec ? `${v.size} — ${v.spec}` : v.size;
}

/* ============================== CATALOG PAGE ============================== */

export function ProductsPage() {
  const { products, settings } = useSiteData();
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const showPrices = settings.showPrices !== false;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => filter === "All" || p.category === filter)
      .filter((p) => {
        if (!q) return true;
        const inVariants = (p.variants ?? []).some((v) => `${v.size} ${v.spec ?? ""}`.toLowerCase().includes(q));
        return `${p.name} ${p.tagline} ${p.description} ${p.category}`.toLowerCase().includes(q) || inVariants;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products, filter, query]);

  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">
            <span className="kf-dot" />
            PRODUCT CATALOG
          </div>
          <h1>
            Every line, <span className="grad">one standard.</span>
          </h1>
          <p className="sub">
            {products.length} products across pipes, fittings, tanks and tools — manufactured in
            Chitwan to national standard.
          </p>
          <div className="catalog-search" style={{ maxWidth: 460, marginTop: 30 }}>
            <span className="catalog-search-icon">{SearchIcon}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or sizes (e.g. 110mm, PN16)…"
              aria-label="Search products"
            />
          </div>
        </div>
      </section>

      <section className="products-future section-pad">
        <div className="wrap">
          <div className="product-filter" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 34 }}>
            {["All", ...PRODUCT_CATEGORIES].map((c) => (
              <button key={c} className={`filter-pill${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>
                {c}
                {c !== "All" && counts.get(c) ? <span className="pill-count">{counts.get(c)}</span> : null}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">No products match “{query || filter}”.</div>
          ) : (
            <div className="product-grid-future">
              {filtered.map((p) => {
                const fp = fromPrice(p, showPrices);
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-card-future">
                    <span className="p-tag-future">{p.category.toUpperCase()}</span>
                    {p.featured && <span className="p-feat-future">★ FEATURED</span>}
                    <div className="p-media-future">
                      <img src={p.image} alt={p.name} loading="lazy" />
                    </div>
                    <h3>{p.name}</h3>
                    <div className="tagline">{p.tagline}</div>
                    <div className="p-meta-row">
                      {(p.variants?.length ?? 0) > 0 && (
                        <span className="p-variants-count">{p.variants.length} variants</span>
                      )}
                      {fp && <span className="p-price-from">{fp}</span>}
                    </div>
                    <div className="p-link-future">View details {ArrowIcon}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Need a spec sheet or bulk pricing?</h2>
              <p>Our sales team answers dealer and contractor enquiries within one working day.</p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================ DETAIL PAGE ============================= */

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products, settings } = useSiteData();
  const product = products.find((p) => p.id === id);
  const showPrices = settings.showPrices !== false;

  if (!product) {
    return (
      <>
        <section className="page-hero">
          <div className="wrap">
            <h1>Product not found.</h1>
            <p className="sub">It may have been removed from the catalog.</p>
            <div style={{ marginTop: 28 }}>
              <Link to="/products" className="btn btn-ghost">
                Back to all products
              </Link>
            </div>
          </div>
        </section>
        <div style={{ height: 120 }} />
      </>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const variants = product.variants ?? [];
  const hasPrices = showPrices && variants.some((v) => typeof v.price === "number");

  return (
    <>
      <section className="detail-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="crumb mono" style={{ color: "var(--cyan)", fontSize: 12, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/">HOME</Link>
            <span>/</span>
            <Link to="/products">PRODUCTS</Link>
            <span>/</span>
            <span>{product.category.toUpperCase()}</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "clamp(32px,4.2vw,52px)" }}>{product.name}</h1>
          <p className="sub" style={{ color: "var(--text-mid)", fontSize: 17, marginTop: 14, maxWidth: 560 }}>
            {product.tagline}
          </p>
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 70 }}>
        <div className="wrap">
          <div className="detail-grid">
            <div className="detail-media-future">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="detail-body">
              <span className="p-tag-future" style={{ position: "static", display: "inline-block" }}>
                {product.category.toUpperCase()}
              </span>
              <p style={{ marginTop: 22, fontSize: 16.5, color: "var(--text-mid)", maxWidth: 560 }}>
                {product.description}
              </p>
              <h2 style={{ fontSize: 24, marginTop: 34 }}>Key specifications</h2>
              <ul className="detail-specs" style={{ listStyle: "none", padding: 0, margin: "18px 0 0" }}>
                {product.specs.map((s) => (
                  <li key={s} style={{ padding: "13px 2px", borderBottom: "1px solid rgba(93,138,184,0.2)", display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ width: 6, height: 6, background: "var(--red)", flex: "none", transform: "translateY(-2px)", boxShadow: "0 0 8px rgba(224,33,41,0.7)" }} />
                    {s}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="btn btn-primary">
                  Call {settings.phone}
                </a>
                <Link to="/contact" className="btn btn-outline">
                  Send an enquiry
                </Link>
              </div>
            </div>
          </div>

          {/* VARIANTS / PRICE TABLE */}
          {variants.length > 0 && (
            <div className="variant-block" style={{ marginTop: 70 }}>
              <div className="section-head-future" style={{ marginBottom: 24 }}>
                <div>
                  <div className="kicker-future">
                    <span className="kf-dot" />
                    SIZES &amp; RATES
                  </div>
                  <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)" }}>
                    {variants.length} variants available.
                  </h2>
                </div>
                {hasPrices && settings.priceListDate && (
                  <p className="price-effective mono">
                    PRICE LIST · EFFECTIVE {settings.priceListDate}
                  </p>
                )}
              </div>

              {hasPrices ? (
                <div className="price-table-wrap">
                  <table className="price-table">
                    <thead>
                      <tr>
                        <th>SIZE</th>
                        <th>RATE</th>
                        {variants.some((v) => v.packing) && <th>PACKING</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <span className="v-size">{variantLabel(v)}</span>
                          </td>
                          <td className="v-price mono">{typeof v.price === "number" ? formatPrice(v.price) : "—"}</td>
                          {variants.some((x) => x.packing) && <td className="v-packing">{v.packing ?? "—"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {product.priceNote && <p className="price-note">ℹ {product.priceNote}</p>}
                </div>
              ) : (
                <div className="variant-chips">
                  {variants.map((v) => (
                    <span key={v.id} className="variant-chip mono">
                      {variantLabel(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {related.length > 0 && (
            <>
              <h3 style={{ margin: "80px 0 28px", fontSize: 24, color: "#fff" }}>
                More in {product.category}
              </h3>
              <div className="product-grid-future">
                {related.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-card-future">
                    <span className="p-tag-future">{p.category.toUpperCase()}</span>
                    <div className="p-media-future">
                      <img src={p.image} alt={p.name} loading="lazy" />
                    </div>
                    <h3>{p.name}</h3>
                    <div className="tagline">{p.tagline}</div>
                    <div className="p-link-future">View details {ArrowIcon}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="contact-future section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap contact-grid">
          <div>
            <div className="kicker-future">
              <span className="kf-dot" />
              ENQUIRE ABOUT THIS PRODUCT
            </div>
            <h2 style={{ color: "#fff", fontSize: "clamp(26px,3vw,36px)" }}>Tell us what you need.</h2>
            <p className="contact-p" style={{ color: "var(--text-mid)" }}>
              Mention quantities and delivery location — our team will quote accordingly.
            </p>
          </div>
          <div className="form-glass">
            <EnquiryForm defaultInterest={product.name} bare />
          </div>
        </div>
      </section>
    </>
  );
}
