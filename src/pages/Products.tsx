import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EnquiryForm } from "../components/EnquiryForm";
import { useRevealOnScroll } from "../components/useRevealOnScroll";
import { useSiteData } from "../data/SiteDataProvider";
import { useQuote } from "../data/QuoteProvider";
import { usePageMeta } from "../data/usePageMeta";
import { priceSummary, rateCell, rateHeading } from "../data/pricing";
import type { Product, ProductCategory, ProductGroupId, ProductVariant } from "../data/types";
import { PRODUCT_CATEGORIES, PRODUCT_GROUPS, productGroupFor } from "../data/types";

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
  return priceSummary(p, showPrices);
}

function variantLabel(v: ProductVariant): string {
  return v.spec ? `${v.size} — ${v.spec}` : v.size;
}

export interface CatalogFilters {
  group: ProductGroupId | "all";
  category: ProductCategory | "all";
  query: string;
}

/** Shared catalog filtering logic keeps family/category/search behavior testable. */
export function filterCatalogProducts(products: Product[], filters: CatalogFilters): Product[] {
  const query = filters.query.trim().toLowerCase();
  return products
    .filter((product) =>
      filters.group === "all" || productGroupFor(product.category).id === filters.group,
    )
    .filter((product) => filters.category === "all" || product.category === filters.category)
    .filter((product) => {
      if (!query) return true;
      const inVariants = (product.variants ?? []).some((variant) =>
        `${variant.size} ${variant.spec ?? ""}`.toLowerCase().includes(query),
      );
      return (
        `${product.name} ${product.tagline} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(query) || inVariants
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ============================== CATALOG PAGE ============================== */

export function ProductsPage() {
  const { products, settings } = useSiteData();
  const [searchParams] = useSearchParams();
  const requestedGroup = searchParams.get("group") as ProductGroupId | null;
  const requestedCategory = searchParams.get("category") as ProductCategory | null;
  const [groupFilter, setGroupFilter] = useState<ProductGroupId | "all">(
    requestedGroup && PRODUCT_GROUPS.some((group) => group.id === requestedGroup) ? requestedGroup : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">(
    requestedCategory && PRODUCT_CATEGORIES.includes(requestedCategory) ? requestedCategory : "all",
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const showPrices = settings.showPrices !== false;
  usePageMeta("Products — pipes, fittings & water tanks", "Browse the full Jagadamba Plastic catalog: HDPE, PVC and CPVC pipes, fittings and water tanks with sizes and rates.");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    const group = searchParams.get("group") as ProductGroupId | null;
    const category = searchParams.get("category") as ProductCategory | null;
    setGroupFilter(group && PRODUCT_GROUPS.some((item) => item.id === group) ? group : "all");
    setCategoryFilter(category && PRODUCT_CATEGORIES.includes(category) ? category : "all");
  }, [searchParams]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  const groupCounts = useMemo(() => {
    const m = new Map<ProductGroupId, number>();
    for (const p of products) {
      const id = productGroupFor(p.category).id;
      m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const visibleCategories = groupFilter === "all"
    ? PRODUCT_CATEGORIES
    : PRODUCT_GROUPS.find((group) => group.id === groupFilter)?.categories ?? PRODUCT_CATEGORIES;

  const filtered = useMemo(
    () => filterCatalogProducts(products, { group: groupFilter, category: categoryFilter, query }),
    [products, groupFilter, categoryFilter, query],
  );
  const productGridRef = useRevealOnScroll<HTMLDivElement>([
    filtered.map((product) => product.id).join("|"),
  ]);

  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">Product catalog</div>
          <h1>
            Every line, <span className="grad">one standard.</span>
          </h1>
          <p className="sub">
            {products.length} products across pipes, fittings and water tanks — manufactured in
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
          <div className="catalog-family-grid" aria-label="Product families">
            {PRODUCT_GROUPS.map((group) => {
              const groupProduct =
                products.find((product) => product.featured && productGroupFor(product.category).id === group.id) ??
                products.find((product) => productGroupFor(product.category).id === group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`catalog-family-card catalog-family-${group.accent}${groupFilter === group.id ? " active" : ""}`}
                  onClick={() => {
                    setGroupFilter(group.id);
                    setCategoryFilter("all");
                  }}
                >
                  {groupProduct && (
                    <span className="catalog-family-image" aria-hidden="true">
                      <img src={groupProduct.image} alt="" loading="lazy" />
                    </span>
                  )}
                  <span className="catalog-family-eyebrow">{group.eyebrow}</span>
                  <strong>{group.label}</strong>
                  <span>{group.categories.join(" · ")}</span>
                  <b>{groupCounts.get(group.id) ?? 0} products</b>
                </button>
              );
            })}
          </div>
          <div className="catalog-subfilters" aria-label="Product categories">
            <button
              type="button"
              className={`filter-pill${categoryFilter === "all" && groupFilter === "all" ? " active" : ""}`}
              onClick={() => {
                setGroupFilter("all");
                setCategoryFilter("all");
              }}
            >
              {groupFilter === "all" ? "All products" : "All families"}
            </button>
            {visibleCategories.map((c) => (
              <button
                key={c}
                type="button"
                className={`filter-pill${categoryFilter === c ? " active" : ""}`}
                onClick={() => setCategoryFilter(c)}
              >
                {c}
                {counts.get(c) ? <span className="pill-count">{counts.get(c)}</span> : null}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">No products match “{query || categoryFilter || groupFilter}”.</div>
          ) : (
            <div className="product-grid-future" ref={productGridRef}>
              {filtered.map((p) => {
                const fp = fromPrice(p, showPrices);
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-card-future">
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
  const quote = useQuote();
  usePageMeta(product ? `${product.name} — ${product.category}` : "Product not found", product?.description);

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

  const group = productGroupFor(product.category);
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const variants = product.variants ?? [];
  const hasPrices = showPrices && variants.some((v) => typeof v.price === "number");

  return (
    <>
      <section className="page-hero detail-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <nav className="crumb mono" aria-label="Breadcrumb">
            <Link to="/">HOME</Link>
            <span aria-hidden="true">/</span>
            <Link to="/products">PRODUCTS</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/products?group=${group.id}`}>{group.label.toUpperCase()}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.category.toUpperCase()}</span>
          </nav>
          <h1>{product.name}</h1>
          <p className="sub">{product.tagline}</p>
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 70 }}>
        <div className="wrap">
          <div className="detail-grid">
            <div className="detail-media-future">
              <img src={product.image} alt={product.name} decoding="async" {...({ fetchpriority: "high" } as Record<string, string>)} />
            </div>
            <div className="detail-body">
              <div className="detail-meta">
                <span>{group.label}</span>
                <span>{product.category}</span>
                {variants.length > 0 && <span>{variants.length} sizes</span>}
                {fromPrice(product, showPrices) && <span className="is-price">{fromPrice(product, showPrices)}</span>}
              </div>
              <p className="detail-lead">{product.description}</p>
              <h2>Key specifications</h2>
              <ul className="detail-specs" style={{ listStyle: "none", padding: 0, margin: "18px 0 0" }}>
                {product.specs.map((s) => (
                  <li key={s} style={{ padding: "13px 2px", borderBottom: "1px solid rgba(93,138,184,0.2)", display: "flex", gap: 10, alignItems: "baseline" }}>
                    {s}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  aria-pressed={quote.has(product.id)}
                  onClick={() => quote.toggle({ id: product.id, name: product.name, category: product.category, image: product.image })}
                >
                  {quote.has(product.id) ? "✓ Added to quote" : "Add to quote"}
                </button>
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="btn btn-outline">
                  Call {settings.phone}
                </a>
              </div>
              <div className="detail-quote-hint" aria-live="polite">
                {quote.items.length > 0 ? (
                  <>
                    {quote.items.length} in your quote list · <Link to="/contact#quote">review &amp; send →</Link>
                  </>
                ) : (
                  "Add products to your quote list, then send them in one enquiry."
                )}
              </div>
            </div>
          </div>

          {/* VARIANTS / PRICE TABLE */}
          {variants.length > 0 && (
            <div className="variant-block" style={{ marginTop: 70 }}>
              <div className="section-head-future" style={{ marginBottom: 24 }}>
                <div>
                  <div className="kicker-future">Sizes &amp; rates</div>
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
                        <th>Size</th>
                        <th>{rateHeading(product)}</th>
                        {variants.some((v) => v.packing) && <th>PACKING</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <span className="v-size">{variantLabel(v)}</span>
                          </td>
                          <td className="v-price mono">{typeof v.price === "number" ? rateCell(product, v.price) : "—"}</td>
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
              <h3 className="detail-related-title">
                More in {product.category} · {group.label}
              </h3>
              <div className="product-grid-future">
                {related.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-card-future">
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
            <div className="kicker-future">Enquire about this product</div>
            <h2 className="detail-enquire-title">Tell us what you need.</h2>
            <p className="contact-p">
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
