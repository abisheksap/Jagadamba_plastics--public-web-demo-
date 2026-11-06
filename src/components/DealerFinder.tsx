import { useState } from "react";
import { Link } from "react-router-dom";
import { DEALERS, PROVINCES } from "../data/dealers";
import type { Province } from "../data/dealers";
import { useSiteData } from "../data/SiteDataProvider";

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

export function DealerFinder() {
  const { settings } = useSiteData();
  const [province, setProvince] = useState<Province | null>(null);
  const dealers = province ? DEALERS.filter((d) => d.province === province) : [];

  return (
    <section className="dealer-finder" id="dealer-finder" aria-labelledby="dealer-finder-title">
      <div className="wrap">
        <div className="dealer-finder-head">
          <div>
            <div className="kicker-future">Find a dealer</div>
            <h2 id="dealer-finder-title">Stock available <span className="grad">near you.</span></h2>
          </div>
          <p>Pick your province to see where Jagadamba products are available. We supply all seven provinces from our Bharatpur plant.</p>
        </div>

        <div className="dealer-provinces" role="group" aria-label="Choose a province">
          {PROVINCES.map((name) => (
            <button key={name} type="button" className={`filter-pill${province === name ? " active" : ""}`} aria-pressed={province === name} onClick={() => setProvince(name)}>
              {name}
            </button>
          ))}
        </div>

        <div className="dealer-results" aria-live="polite">
          {!province && <p className="dealer-hint">Select a province above to see dealers and supply contacts.</p>}
          {province && dealers.map((d) => (
            <article className="dealer-card" key={`${d.name}-${d.district}`}>
              <h3>{d.name}</h3>
              <p>{d.district}, {d.province}{d.address ? ` · ${d.address}` : ""}</p>
              <a className="btn btn-outline" href={telHref(d.phone)}>Call {d.phone}</a>
            </article>
          ))}
          {province && dealers.length === 0 && (
            <article className="dealer-card dealer-card-hq">
              <span className="dealer-badge">Head office · supplies {province}</span>
              <h3>Jagadamba Plastic Industries</h3>
              <p>{settings.address}</p>
              <p>We&apos;re adding dealers in {province}. Call us and we&apos;ll connect you to the nearest stockist or arrange direct delivery.</p>
              <div className="dealer-actions">
                <a className="btn btn-primary" href={telHref(settings.phone)}>Call {settings.phone}</a>
                <Link className="btn btn-outline" to="/contact#quote">Send an enquiry</Link>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
