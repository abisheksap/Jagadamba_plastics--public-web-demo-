import { EnquiryForm } from "../components/EnquiryForm";
import { useSiteData } from "../data/SiteDataProvider";

export default function Contact() {
  const { settings } = useSiteData();

  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">
            <span className="kf-dot" />
            GET IN TOUCH
          </div>
          <h1>
            Become a dealer, <span className="grad">or place an order.</span>
          </h1>
          <p className="sub">
            Reach our Bharatpur office directly, or send details through the form and our sales team
            will follow up within one working day.
          </p>
        </div>
      </section>

      <section className="contact-future section-pad">
        <div className="wrap contact-grid">
          <div className="contact-card-future">
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
            <div className="contact-row-future">
              <span className="c-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7C16.4 3.66 15.4 3.6 14.2 3.6c-2.4 0-4 1.46-4 4.15v2.15H7.5V13h2.7v8h3.3Z" />
                </svg>
              </span>
              <div>
                <div className="c-lbl">FACEBOOK</div>
                <a href={settings.facebook} target="_blank" rel="noreferrer">
                  Jagadamba Plastic Industry
                </a>
              </div>
            </div>
            <div className="contact-row-future">
              <span className="c-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12s0-3.2-.4-4.7c-.24-.9-.94-1.6-1.83-1.84C18.2 5 12 5 12 5s-6.2 0-7.77.46A2.49 2.49 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7c.24.9.94 1.57 1.83 1.8C5.8 19 12 19 12 19s6.2 0 7.77-.46a2.49 2.49 0 0 0 1.83-1.8c.4-1.5.4-4.74.4-4.74ZM10 15V9l5.2 3-5.2 3Z" />
                </svg>
              </span>
              <div>
                <div className="c-lbl">YOUTUBE</div>
                <a href={settings.youtube} target="_blank" rel="noreferrer">
                  Jagadamba Pipe &amp; Fittings
                </a>
              </div>
            </div>

            <div style={{ marginTop: 28, padding: 22, borderRadius: 14, border: "1px solid rgba(89,210,232,0.25)", background: "var(--cyan-soft)" }}>
              <h3 style={{ color: "#fff", fontSize: 16 }}>Dealer enquiries welcome</h3>
              <p style={{ color: "var(--text-mid)", fontSize: 13.5, marginTop: 8 }}>
                We onboard dealers across all seven provinces. Ask about territory availability,
                margins and delivery schedules.
              </p>
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
