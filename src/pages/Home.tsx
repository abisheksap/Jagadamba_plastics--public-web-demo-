import { Link } from "react-router-dom";
import { ProductShowcase } from "../components/ProductShowcase";
import { EnquiryForm } from "../components/EnquiryForm";
import { ProductPulse, StatsBand, Ticker, BrandStory } from "../components/FutureUI";
import { ProcessJourney } from "../components/ProcessJourney";
import { useRevealOnScroll } from "../components/useRevealOnScroll";
import { useSiteData } from "../data/SiteDataProvider";
import { pickApproved } from "../data/backend";
import type { Product } from "../data/types";

const ArrowIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="3.2" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <path d="M6 12h8M11.5 7.2 17.5 12l-6 4.8" />
  </svg>
);

const HomeIcon = (
  <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 24 24 10l18 14" />
    <path d="M10 22v16h28V22" />
    <rect x="20" y="28" width="8" height="10" />
  </svg>
);

function selectFlowProducts(products: Product[]): Product[] {
  const sorted = [...products].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder,
  );
  const picked: Product[] = [];
  const seenCategories = new Set<string>();

  for (const product of sorted) {
    if (picked.length >= 8) break;
    if (!seenCategories.has(product.category)) {
      picked.push(product);
      seenCategories.add(product.category);
    }
  }
  for (const product of sorted) {
    if (picked.length >= 8) break;
    if (!picked.some((item) => item.id === product.id)) picked.push(product);
  }
  return picked;
}

export default function Home() {
  const { products, gallery, reviews: allReviews, settings, content } = useSiteData();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const reviews = pickApproved(allReviews).slice(0, 3);
  const variantCount = products.reduce((n, p) => n + (p.variants?.length ?? 0), 0);
  const flowProducts = selectFlowProducts(products);
  const audienceRef = useRevealOnScroll<HTMLDivElement>();
  const productGridRef = useRevealOnScroll<HTMLDivElement>([featured.map((p) => p.id).join("|")]);
  const reviewGridRef = useRevealOnScroll<HTMLDivElement>([reviews.map((r) => r.id).join("|")]);
  const galleryGridRef = useRevealOnScroll<HTMLDivElement>([gallery.map((g) => g.id).join("|")]);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <div className="wrap hero-inner" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <div className="hero-eyebrow">
              <span className="rule" />
              {content.heroEyebrow}
            </div>
            <h1>
              <span className="line">{content.heroTitleLine1}</span>
              <span className="line">
                <span className="accent">{content.heroTitleLine2}</span>
              </span>
            </h1>
            <p className="hero-sub">{content.heroSub}</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">
                Explore our products
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                Talk to a dealer
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <div className="num mono">{products.length}</div>
                <div className="lbl">Products in range</div>
              </div>
              <div>
                <div className="num mono">7</div>
                <div className="lbl">Provinces served</div>
              </div>
              <div>
                <div className="num mono">2006</div>
                <div className="lbl">Manufacturing since</div>
              </div>
            </div>
          </div>
          <ProductShowcase />
        </div>
        <div className="scroll-cue">
          SCROLL
          <div className="stem" />
        </div>
      </section>

      {/* TICKER */}
      <Ticker />

      {/* STATS */}
      <section className="stats-future">
        <div className="wrap">
          <StatsBand
            stats={[
              { target: 2063, suffix: " B.S.", label: "Founded — milestone of the Manakamana Group" },
              { target: 6, label: "Product lines, one supply chain" },
              { target: 77, label: "Districts reached by our dealer network" },
              { target: Math.max(variantCount, 100), label: "Sizes & rates in the price list" },
            ]}
          />
        </div>
      </section>

      {/* AUDIENCE GLASS CARDS */}
      <section className="about section-pad">
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                WHO WE SERVE
              </div>
              <h2>
                Built for <span className="grad">every water need</span> in Nepal.
              </h2>
            </div>
            <p>
              Government-certified plastic pipe and water storage manufacturing, supplying dealers
              across all seven provinces — district 1 to 77.
            </p>
          </div>
          <div className="stat-cards-future audience-cards-future" style={{ gridTemplateColumns: "repeat(3,1fr)" }} ref={audienceRef}>
            <div className="glass-card">
              {HomeIcon}
              <h3>Homes &amp; builders</h3>
              <p>Water tanks, PVC and CPVC fittings for household plumbing, hot-water lines and rooftop storage.</p>
              <div className="g-tag">WATER TANK · PVC · CPVC FITTINGS</div>
            </div>
            <div className="glass-card">
              <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="24" cy="14" r="6" />
                <path d="M24 20v24M14 30h20M16 38h16" />
              </svg>
              <h3>Farms &amp; irrigation</h3>
              <p>Borewell casing and flexible HDPE pipe built for groundwater extraction and field irrigation.</p>
              <div className="g-tag">BOREWELL PIPES · HDPE PIPE</div>
            </div>
            <div className="glass-card">
              <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="6" y="18" width="36" height="12" rx="1" />
                <path d="M6 18 2 24l4 6" />
                <path d="M42 18l4 6-4 6" />
              </svg>
              <h3>Industry &amp; infrastructure</h3>
              <p>Underground drainage systems built to handle structural load on municipal and industrial sites.</p>
              <div className="g-tag">UG DRAINAGE PIPES</div>
            </div>
          </div>
          <div style={{ marginTop: 34 }}>
            <Link to="/about" className="p-link-future" style={{ display: "inline-flex" }}>
              Read our full story {ArrowIcon}
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT ELEMENTS */}
      <ProductPulse products={flowProducts} />

      <ProcessJourney products={products} />

      {/* BRAND STORY / SCHEMES */}
      <BrandStory products={flowProducts} />

      {/* FEATURED PRODUCTS */}
      <section className="products-future section-pad">
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                OUR PRODUCTS
              </div>
              <h2>
                Six lines, <span className="grad">one standard.</span>
              </h2>
            </div>
            <p>
              From underground drainage to rooftop storage — manufactured to national standard and
              ready for dealer stock nationwide.
            </p>
          </div>
          <div className="product-grid-future" ref={productGridRef}>
            {featured.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="p-card-future">
                <div className="p-media-future">
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <h3>{p.name}</h3>
                <div className="tagline">{p.tagline}</div>
                <p className="desc">{p.description}</p>
                <div className="p-link-future">View specification {ArrowIcon}</div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
            <Link to="/products" className="btn btn-outline">
              Browse the full catalog
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS TEASER */}
      <section className="reviews-future section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                DEALER NETWORK
              </div>
              <h2>
                What our <span className="grad">dealers say.</span>
              </h2>
            </div>
            <p>Real feedback from the people who stock and install our products every day.</p>
          </div>
          <div className="review-grid-future" ref={reviewGridRef}>
            {reviews.map((r) => (
              <div key={r.id} className="r-card-future">
                <div className="stars">{"★".repeat(r.rating)}</div>
                <p className="quote">“{r.quote}”</p>
                <div className="who">
                  <div className="name">{r.name}</div>
                  <div className="biz">{r.business}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 30 }}>
            <Link to="/reviews" className="p-link-future" style={{ display: "inline-flex" }}>
              Read all reviews &amp; share yours {ArrowIcon}
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY TEASER */}
      <section className="gallery-future section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                GALLERY
              </div>
              <h2>
                On site, <span className="grad">across Nepal.</span>
              </h2>
            </div>
            <p>Installation photos and product videos from the field.</p>
          </div>
          <div className="gallery-grid-future" ref={galleryGridRef}>
            {gallery.slice(0, 4).map((g) => (
              <Link key={g.id} to="/gallery" className="g-tile-future">
                <img src={g.image} alt={g.title} loading="lazy" />
                <div className="g-shade" />
                <span className="g-label">{g.title.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Build Nepal's plastic industry with us.</h2>
              <p>
                Dealer enquiries, bulk orders and careers — our Bharatpur office answers within one
                working day.
              </p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-future section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap contact-grid">
          <div>
            <div className="kicker-future">
              <span className="kf-dot" />
              GET IN TOUCH
            </div>
            <h2 style={{ color: "#fff", fontSize: "clamp(26px,3vw,36px)" }}>
              Become a dealer, or place an order.
            </h2>
            <p className="contact-p" style={{ color: "var(--text-mid)" }}>
              Reach our Bharatpur office directly, or send details through the form and our sales
              team will follow up.
            </p>
            <div style={{ marginTop: 30 }}>
              <div className="contact-row-future">
                <span className="c-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <div className="c-lbl">ADDRESS</div>
                  {settings.address}
                </div>
              </div>
              <div className="contact-row-future">
                <span className="c-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1.1.4 2.2.8 3.2a2 2 0 0 1-.4 2.2L8.1 10.5a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.2-.4c1 .4 2.1.7 3.2.8a2 2 0 0 1 1.1 2.4Z" />
                  </svg>
                </span>
                <div>
                  <div className="c-lbl">PHONE</div>
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>{settings.phone}</a>
                  {settings.phoneAlt && (
                    <a href={`tel:${settings.phoneAlt.replace(/[^+\d]/g, "")}`} style={{ marginLeft: 14 }}>
                      {settings.phoneAlt}
                    </a>
                  )}
                </div>
              </div>
              <div className="contact-row-future">
                <span className="c-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <div>
                  <div className="c-lbl">EMAIL</div>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </div>
              </div>
            </div>
          </div>
          <div className="form-glass">
            <EnquiryForm bare />
          </div>
        </div>
      </section>
    </>
  );
}
