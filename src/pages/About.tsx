import { Link } from "react-router-dom";
import { StatsBand } from "../components/FutureUI";

/** Word-for-word copy carried over from jagadambaplastic.com (the company's
 * original site), so the corporate voice of the founders stays intact. */
const DIRECTOR_MESSAGE = `JAGADAMBA PLASTIC PVT. LTD. was established in 2063 B.S., which proved to be the
milestone of the Manakamana Group that everyone knows today. It has learned from the past and
strived to make a better future in the plastic sector by putting all efforts into invention,
innovation, reformation, replacement and market extension. Jagadamba Plastic Pvt. Ltd. is an
enterprise including research, design, manufacture and marketing departments — strictly conformed
to international standards and built on the introduction of advanced technology. We are striving
for the perfect service to completely show our corporate image and product brand.`;

const MD_MESSAGE = `The entire manufacturing, designing and testing are carried out by our qualified team of
engineers and experts on a regular basis. Our various products are certified with NS by the
Government of Nepal. Today we are proud and thankful that we are being loved and are able to be
one of the best plastic industries in our country, overcoming all the needs and desires of our
customers. It is all because of our customers, employees, distributors and advisors that we are
able to stand at the peak — and we will keep on serving and fulfilling our customer needs and
desires, the way we are doing now.`;

interface Leader {
  role: string;
  name: string;
  nepaliRole: string;
  message: string;
  initials: string;
}

const LEADERS: Leader[] = [
  {
    role: "Director",
    name: "Jagadamba Plastic Industries Pvt. Ltd.",
    nepaliRole: "निर्देशक",
    message: DIRECTOR_MESSAGE,
    initials: "JP",
  },
  {
    role: "Managing Director",
    name: "Manakamana Group",
    nepaliRole: "प्रबन्ध निर्देशक",
    message: MD_MESSAGE,
    initials: "MG",
  },
];

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">
            <span className="kf-dot" />
            ABOUT US
          </div>
          <h1>
            Built for <span className="grad">every water need</span> in Nepal.
          </h1>
          <p className="sub">
            Government-certified plastic pipe and water storage manufacturing in Bharatpur, Chitwan —
            supplying dealers across all seven provinces, district 1 to 77.
          </p>
        </div>
      </section>

      {/* OUR STORY — sourced from the company's original website */}
      <section className="section-pad" style={{ paddingTop: 80 }}>
        <div className="wrap">
          <div className="section-head-future" style={{ marginBottom: 40 }}>
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                OUR STORY
              </div>
              <h2 style={{ fontSize: "clamp(24px,2.8vw,34px)" }}>
                Who <span className="grad">we are.</span>
              </h2>
            </div>
            <p>
              A milestone company of the Manakamana Group — manufacturing to Nepal Standard before
              anything reaches a dealer shelf.
            </p>
          </div>
          <div className="story-copy">
            <p>
              Jagadamba Plastic Industries has manufactured HDPE, PVC and CPVC pipe, fittings and
              water tanks in Bharatpur, Chitwan since 2063 B.S. What began as a single extrusion line
              now spans six product families feeding a dealer network that stretches from Province 1
              to Province 7. Every batch is pressure-tested and dimension-checked against Nepal
              Standard — that discipline is why contractors ask for Jagadamba pipe by name, and why
              our dealers restock with confidence.
            </p>
            <p>
              Jagadamba Plastic Pvt. Ltd. is an enterprise that spans research, design, manufacture
              and marketing — strictly conformed to international standards and built on advanced
              technology, with the entire manufacturing, design and testing carried out by our
              qualified team of engineers and experts on a regular basis.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item">
              <div className="tl-year">2063 B.S. · 2006 AD</div>
              <h3>Founded in Bharatpur</h3>
              <p>
                Jagadamba Plastic Industries begins manufacturing as a milestone company of the
                Manakamana Group, serving Chitwan's growing construction market.
              </p>
            </div>
            <div className="tl-item">
              <div className="tl-year">EXPANSION</div>
              <h3>Six product families</h3>
              <p>
                From the first PVC lines to HDPE coils, borewell casing, UG drainage, CPVC fittings
                and rooftop water tanks — one supply chain covering every water need.
              </p>
            </div>
            <div className="tl-item">
              <div className="tl-year">CERTIFICATION</div>
              <h3>NS &amp; ISO certified manufacturing</h3>
              <p>
                Government-certified plants with in-house testing: every product line is tested and
                certified before it reaches a dealer shelf.
              </p>
            </div>
            <div className="tl-item">
              <div className="tl-year">TODAY</div>
              <h3>Nationwide dealer network</h3>
              <p>
                Dealers stock Jagadamba products across all 77 districts of Nepal — Province 1 to 7,
                from household plumbing to national infrastructure sites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP — the words of the Director & MD, carried from the original site */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                LEADERSHIP
              </div>
              <h2>
                Words from the <span className="grad">Director &amp; MD.</span>
              </h2>
            </div>
            <p>
              The vision that set our direction — in the words of the people who lead it, as shared
              on jagadambaplastic.com.
            </p>
          </div>
          <div className="leader-grid">
            {LEADERS.map((l) => (
              <figure className="leader-card" key={l.role}>
                <span className="leader-quote-mark">“</span>
                <blockquote>{l.message}</blockquote>
                <figcaption>
                  <span className="leader-avatar" aria-hidden="true">
                    {l.initials}
                  </span>
                  <span className="leader-meta">
                    <span className="leader-role">{l.role}</span>
                    <span className="leader-name">{l.name}</span>
                    <span className="leader-nepali">{l.nepaliRole}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <StatsBand
            stats={[
              { target: 2063, suffix: " B.S.", label: "Founded — milestone of the Manakamana Group" },
              { target: 6, label: "Product lines, one supply chain" },
              { target: 77, label: "Districts reached by our dealer network" },
              { target: 100, suffix: "+", label: "SKUs in the full catalog" },
            ]}
          />
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                WHO WE SERVE
              </div>
              <h2>
                From homes to <span className="grad">highways.</span>
              </h2>
            </div>
            <p>Different sites, different loads — the same certified standard behind them all.</p>
          </div>
          <div className="stat-cards-future" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="glass-card">
              <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 24 24 10l18 14" />
                <path d="M10 22v16h28V22" />
                <rect x="20" y="28" width="8" height="10" />
              </svg>
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
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head-future">
            <div>
              <div className="kicker-future">
                <span className="kf-dot" />
                QUALITY
              </div>
              <h2>
                Certified to <span className="grad">national standard.</span>
              </h2>
            </div>
            <p>Every product line is tested and certified before it reaches a dealer shelf.</p>
          </div>
          <div className="cert-row-future">
            {[
              { name: "NS Mark", code: "NEPAL STANDARD" },
              { name: "ISO 9001", code: "QUALITY MGMT" },
              { name: "NS Pipe", code: "PVC PIPE" },
              { name: "ISO Certified", code: "QUALITY MGMT" },
            ].map((c) => (
              <div key={c.name} className="cert-card-future">
                <svg className="cert-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4Z" />
                </svg>
                <div className="cert-name">{c.name}</div>
                <div className="cert-code">{c.code}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48 }}>
            <Link to="/products" className="btn btn-primary">
              Explore the product range
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
