/** Futuristic shared UI pieces: ticker, count-up stat cards, product atlas, pipeline band. */
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

const ArrowUpRight = ({ size = 16 }: { size?: number }) => <span aria-hidden="true" style={{ fontSize: size }}>↗</span>;
import type { Product } from "../data/types";
import { PRODUCT_GROUPS } from "../data/types";

const TICKER_ITEMS = [
  { pre: "MADE IN", b: "NEPAL" },
  { pre: "DEALER NETWORK —", b: "PROVINCE 1 → 7" },
  { pre: "CERTIFIED", b: "NS · ISO" },
  { pre: "EST.", b: "2063 B.S." },
  { pre: "HDPE · PVC · CPVC ·", b: "TANKS" },
  { pre: "MANAKAMANA", b: "GROUP" },
  { pre: "CHITWAN,", b: "BHARATPUR" },
];

export function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="dot" />
            {item.pre} <b>{item.b}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- count-up hook ---------- */
function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

export interface FutureStat {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

function StatCard({ stat, active }: { stat: FutureStat; active: boolean }) {
  const value = useCountUp(stat.target, active);
  return (
    <div className="glass-card stat-card-future">
      <div className="num mono">
        {stat.prefix}
        {String(value)}
        {stat.suffix && <span className="suffix">{stat.suffix}</span>}
      </div>
      <div className="lbl">{stat.label}</div>
    </div>
  );
}

export function StatsBand({ stats }: { stats: FutureStat[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="stat-cards-future" ref={ref}>
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} active={active} />
      ))}
    </div>
  );
}

/* ---------- grouped CMS-driven product atlas ---------- */
export function ProductPulse({ products }: { products: Product[] }) {
  const groups = PRODUCT_GROUPS.map((group) => {
    const matches = products.filter((product) => group.categories.includes(product.category));
    if (group.id === "tanks") matches.sort((a, b) => Number(b.name.toLowerCase().includes("black")) - Number(a.name.toLowerCase().includes("black")));
    if (group.id === "fittings") matches.sort((a, b) => Number(b.name.toLowerCase().includes("elbow")) - Number(a.name.toLowerCase().includes("elbow")));
    return { ...group, items: matches.slice(0, 4) };
  }).filter((group) => group.items.length > 0);

  if (!groups.length) return null;

  return (
    <section className="product-atlas" aria-label="Jagadamba product families">
      <div className="wrap product-atlas-head">
        <div>
          <div className="kicker-future">
            <span className="kf-dot" />
            PRODUCT ATLAS
          </div>
          <h2>
            Find the right <span className="grad">waterway.</span>
          </h2>
        </div>
        <p>
          Three product families, one organized catalog. Explore pipes, fittings and tanks by how
          they work together on site.
        </p>
      </div>
      <div className="wrap product-atlas-grid">
        {groups.map((group) => (
          <Link key={group.id} to={`/products?group=${group.id}`} className={`atlas-card atlas-${group.accent}`}>
            <div className="atlas-card-top">
              <span className="atlas-eyebrow">{group.eyebrow}</span>
              <span className="atlas-arrow">↗</span>
            </div>
            <div className="atlas-visual" aria-hidden="true">
              <span className="atlas-ring atlas-ring-a" />
              <span className="atlas-ring atlas-ring-b" />
              {group.items.slice(0, 3).map((product, index) => (
                <span key={product.id} className={`atlas-product atlas-product-${index + 1}`}>
                  <img src={product.image} alt="" loading="lazy" />
                </span>
              ))}
            </div>
            <div className="atlas-copy">
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <div className="atlas-categories">{group.categories.join(" · ")}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function flowCategoryLabel(product: Product): string {
  return product.category.replace(" Pipe", "").replace(" Fittings", "").toUpperCase();
}

/* ---------- pipeline flow band ---------- */
export function BrandStory({ products = [] }: { products?: Product[] }) {
  const stories = [
    { kicker: "OUR WORLD", title: "Made for the way Nepal builds.", copy: "From a household line to a district water network, the right product starts with the right material and a clear purpose.", image: "/images/products-v2/borewell-casing-pipe.png", tag: "WATER INFRASTRUCTURE" },
    { kicker: "OUR MISSION", title: "Make dependable water systems ordinary.", copy: "We manufacture accessible pipe, fittings and storage that help families, farmers and builders move water with confidence.", image: "/images/products-v2/cpvc-elbow-90.png", tag: "CONNECTED BY DESIGN" },
    { kicker: "OUR STANDARD", title: "Every joint has to earn trust.", copy: "Consistent dimensions, practical fittings and storage that is ready for the realities of installation — that is the Jagadamba promise.", image: "/images/products-v2/black-tank.png", tag: "QUALITY YOU CAN SEE" },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 5200);
    return () => window.clearInterval(timer);
  }, []);
  const story = stories[active];
  const supporting = products.filter((product) => ["PVC Fittings", "CPVC Fittings", "Water Tank"].includes(product.category)).slice(0, 3);
  return <section className="brand-story" aria-label="Our world, mission and standard">
    <div className="wrap brand-story-grid">
      <div className="brand-story-copy"><div className="kicker-future"><span className="kf-dot" /> {story.kicker}</div><h2>{story.title}</h2><p>{story.copy}</p><div className="brand-story-dots">{stories.map((item, i) => <button type="button" key={item.kicker} className={i === active ? "active" : ""} onClick={() => setActive(i)} aria-label={`Show ${item.kicker.toLowerCase()}`} />)}</div><span className="brand-story-tag">{story.tag}</span></div>
      <div className="brand-story-visual"><div className="story-pipe-line" /><img key={story.image} src={story.image} alt={story.title} /><div className="story-caption"><span>JAGADAMBA / 0{active + 1}</span><b>{story.tag}</b></div></div>
    </div>
    <div className="wrap story-support-strip">{supporting.map((product) => <Link key={product.id} to={`/products/${product.id}`}><img src={product.image} alt="" loading="lazy" /><span>{product.category}</span><ArrowUpRight size={14} /></Link>)}</div>
  </section>;
}

export function ProcessFlow({ products = [] }: { products?: Product[] }) {
  const nodes = ["EXTRUDE", "MOULD", "TEST", "CERTIFY", "DISPATCH"];
  const nodeId = useId();
  const flowProducts = products.slice(0, nodes.length);
  return (
    <div className="flow-band" aria-label="Manufacturing flow with featured products">
      <div className="flow-band-glow" />
      <svg viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient
            id={`${nodeId}-pulse`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1200"
            y2="0"
          >
            <stop offset="0%" stopColor="#59d2e8" stopOpacity="0.25" />
            <stop offset="45%" stopColor="#59d2e8" />
            <stop offset="100%" stopColor="#e02129" />
          </linearGradient>
        </defs>
        <path className="flow-line" d="M0 60 H1200" />
        {nodes.map((n, i) => {
          const x = 130 + i * 220;
          return (
            <g key={n}>
              <path
                className="flow-pulse"
                d="M0 60 H1200"
                style={{ animationDelay: `${(i * 0.85).toFixed(2)}s`, stroke: `url(#${nodeId}-pulse)` }}
              />
              <circle className="flow-node" cx={x} cy={60} r={6} />
              <circle
                className="flow-node-halo"
                cx={x}
                cy={60}
                r={11}
                style={{ animationDelay: `${(i * 0.42).toFixed(2)}s` }}
              />
              <text className="flow-node-label" x={x} y={96} textAnchor="middle">
                {n}
              </text>
              <text className="flow-node-step" x={x} y={30} textAnchor="middle">
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
        {flowProducts.map((product, i) => {
          const x = 130 + i * 220;
          return (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="flow-product-link"
              aria-label={`View ${product.name}`}
            >
              <g className="flow-product-node">
                <circle className="flow-product-ring" cx={x} cy={60} r={21} />
                <image
                  className="flow-product-image"
                  href={product.image}
                  x={x - 16}
                  y={44}
                  width="32"
                  height="32"
                  preserveAspectRatio="xMidYMid meet"
                />
                <text className="flow-product-category" x={x} y={17} textAnchor="middle">
                  {flowCategoryLabel(product)}
                </text>
              </g>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
