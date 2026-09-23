import { useState } from "react";
import { Link } from "react-router-dom";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { useSiteData } from "../data/SiteDataProvider";

export default function Gallery() {
  const { gallery, settings } = useSiteData();
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">
            <span className="kf-dot" />
            GALLERY
          </div>
          <h1>
            On site, <span className="grad">across Nepal.</span>
          </h1>
          <p className="sub">
            Installation photos and product videos from Bharatpur to Nepalgunj — managed live from
            the admin panel.
          </p>
        </div>
      </section>

      <section className="gallery-future section-pad">
        <div className="wrap">
          {gallery.length === 0 ? (
            <div className="empty-state">No gallery items yet.</div>
          ) : (
            <div className="gallery-grid-future">
              {gallery.map((g, i) =>
                g.videoUrl ? (
                  <a key={g.id} href={g.videoUrl} target="_blank" rel="noreferrer" className="g-tile-future">
                    <img src={g.image} alt={g.title} loading="lazy" />
                    <div className="g-shade" />
                    <svg className="g-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7L8 5Z" />
                    </svg>
                    <span className="g-label">{g.title.toUpperCase()}</span>
                  </a>
                ) : (
                  <button key={g.id} className="g-tile-future" onClick={() => setLightbox(i)} style={{ padding: 0 }}>
                    <img src={g.image} alt={g.title} loading="lazy" />
                    <div className="g-shade" />
                    <span className="g-label">{g.title.toUpperCase()}</span>
                  </button>
                ),
              )}
            </div>
          )}
          <div style={{ marginTop: 34, display: "flex", justifyContent: "flex-end" }}>
            <a href={settings.youtube} target="_blank" rel="noreferrer" className="p-link-future" style={{ display: "inline-flex" }}>
              Full gallery &amp; videos on YouTube
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="3.2" cy="12" r="1.6" fill="currentColor" stroke="none" />
                <path d="M6 12h8M11.5 7.2 17.5 12l-6 4.8" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Installed something with our products?</h2>
              <p>We'd love to feature your site — send photos through the contact page.</p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              Share your site
            </Link>
          </div>
        </div>
      </section>

      <GalleryLightbox
        items={gallery.filter((g) => !g.videoUrl)}
        index={lightbox}
        onClose={() => setLightbox(null)}
      />
    </>
  );
}
