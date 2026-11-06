import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/** Each audience links straight to the matching part of the catalog. */
const AUDIENCES = [
  {
    tone: "blue",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=320&q=82",
    title: "Homes & builders",
    text: "Water tanks, PVC and CPVC fittings for household plumbing, hot-water lines and rooftop storage.",
    links: [
      { label: "Water tanks", to: "/products?group=tanks" },
      { label: "PVC & CPVC fittings", to: "/products?group=fittings" },
    ],
  },
  {
    tone: "red",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=320&q=82",
    title: "Farms & irrigation",
    text: "Borewell casing and flexible HDPE pipe built for groundwater extraction and field irrigation.",
    links: [{ label: "Borewell & HDPE pipes", to: "/products?group=pipes" }],
  },
  {
    tone: "gold",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=320&q=82",
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
            <Link
              to={a.links[0].to}
              className="serve-row-hit"
              aria-label={`View ${a.title} products`}
            />
            <span className="serve-icon">
              <img src={a.image} alt="" loading="lazy" decoding="async" />
            </span>
            <div className="serve-copy">
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              <div className="serve-links">
                {a.links.map((l) => (
                  <Link key={l.label} to={l.to}>{l.label}</Link>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
