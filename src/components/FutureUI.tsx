/** Futuristic shared UI pieces: ticker, count-up stat cards, pipeline band. */
import { useEffect, useRef, useState } from "react";

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

/* ---------- pipeline flow band ---------- */
export function ProcessFlow() {
  const nodes = ["EXTRUDE", "MOULD", "TEST", "CERTIFY", "DISPATCH"];
  return (
    <div className="flow-band" aria-hidden="true">
      <svg viewBox="0 0 1200 96" preserveAspectRatio="xMidYMid meet">
        <path className="flow-line" d="M0 48 H1200" />
        {nodes.map((n, i) => {
          const x = 130 + i * 220;
          return (
            <g key={n}>
              <path className="flow-pulse" d="M0 48 H1200" style={{ animationDelay: `${i * 0.68}s` }} />
              <circle className="flow-node" cx={x} cy={48} r={7} />
              <text className="flow-node-label" x={x} y={76} textAnchor="middle">
                {n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
