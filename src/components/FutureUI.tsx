/** Futuristic shared UI pieces: ticker, count-up stat cards, pipeline band. */
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../data/types";

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
      const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
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
        {value.toLocaleString()}
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

/* ---------- CMS-driven product pulse strip ---------- */
export function ProductPulse({ products }: { products: Product[] }) {
  const items = products.slice(0, 8);
  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <section className="product-pulse" aria-label="Featured company products">
      <div className="wrap product-pulse-head">
        <div>
          <div className="kicker-future">
            <span className="kf-dot" />
            PRODUCT PULSE
          </div>
          <h2>
            Company products, <span className="grad">always in motion.</span>
          </h2>
        </div>
        <p>Live product cards from the Jagadamba catalog, moving from our factory flow to your project.</p>
      </div>
      <div className="product-pulse-window">
        <div className="product-pulse-track">
          {doubled.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              to={`/products/${product.id}`}
              className="product-pulse-card"
              aria-hidden={i >= items.length}
              tabIndex={i >= items.length ? -1 : undefined}
            >
              <span className="product-pulse-icon">
                <img src={product.image} alt="" loading="lazy" />
              </span>
              <span className="product-pulse-copy">
                <b>{product.name}</b>
                <small>{product.category}</small>
              </span>
              <span className="product-pulse-arrow">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- pipeline flow band ---------- */
export function ProcessFlow({ products = [] }: { products?: Product[] }) {
  const nodes = ["EXTRUDE", "MOULD", "TEST", "CERTIFY", "DISPATCH"];
  const nodeId = useId();
  const flowProducts = products.slice(0, 5);
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
          const x = 240 + i * 220;
          const y = i % 2 === 0 ? 34 : 86;
          return (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="flow-product-link"
              aria-label={`View ${product.name}`}
            >
              <g className="flow-product-node">
                <circle className="flow-product-ring" cx={x} cy={y} r={18} />
                <image
                  className="flow-product-image"
                  href={product.image}
                  x={x - 14}
                  y={y - 14}
                  width="28"
                  height="28"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ animationDelay: `${(i * 0.38).toFixed(2)}s` }}
                />
              </g>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
