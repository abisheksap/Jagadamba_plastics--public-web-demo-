import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const HomeIcon = (
  <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 24 24 10l18 14" />
    <path d="M10 22v16h28V22" />
    <rect x="20" y="28" width="8" height="10" />
  </svg>
);

const FarmIcon = (
  <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="24" cy="14" r="6" />
    <path d="M24 20v24M14 30h20M16 38h16" />
  </svg>
);

const IndustryIcon = (
  <svg className="g-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="6" y="18" width="36" height="12" rx="1" />
    <path d="M6 18 2 24l4 6" />
    <path d="M42 18l4 6-4 6" />
  </svg>
);

/** Each audience links straight to the matching part of the catalog. */
const AUDIENCES = [
  {
    tone: "blue",
    icon: HomeIcon,
    title: "Homes & builders",
    text: "Water tanks, PVC and CPVC fittings for household plumbing, hot-water lines and rooftop storage.",
    links: [
      { label: "Water tanks", to: "/products?group=tanks" },
      { label: "PVC & CPVC fittings", to: "/products?group=fittings" },
    ],
  },
  {
    tone: "red",
    icon: FarmIcon,
    title: "Farms & irrigation",
    text: "Borewell casing and flexible HDPE pipe built for groundwater extraction and field irrigation.",
    links: [{ label: "Borewell & HDPE pipes", to: "/products?group=pipes" }],
  },
  {
    tone: "gold",
    icon: IndustryIcon,
    title: "Industry & infrastructure",
    text: "Underground drainage systems built to handle structural load on municipal and industrial sites.",
    links: [{ label: "UG drainage pipes", to: "/products?group=pipes" }],
  },
];

/** "Who we serve": intro on the left, a linked list of audiences on the right. Used on Home and About. */
export function ServeSection({ heading, text, showStoryLink = true }: { heading: ReactNode; text: string; showStoryLink?: boolean }) {
  return (
    <div className="serve-layout">
      <div className="serve-intro">
        <div className="kicker-future">Who we serve</div>
        <h2>{heading}</h2>
        <p>{text}</p>
        {showStoryLink && (
          <Link to="/about" className="serve-story-link">
            Read our full story
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        )}
      </div>
      <ol className="serve-list">
        {AUDIENCES.map((a) => (
          <li key={a.title} className={`serve-row serve-${a.tone}`}>
            <span className="serve-icon">{a.icon}</span>
            <div className="serve-copy">
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              <div className="serve-links">
                {a.links.map((l) => (
                  <Link key={l.label} to={l.to}>{l.label}</Link>
                ))}
              </div>
            </div>
            <Link to={a.links[0].to} className="serve-go" aria-label={`Browse products for ${a.title}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
