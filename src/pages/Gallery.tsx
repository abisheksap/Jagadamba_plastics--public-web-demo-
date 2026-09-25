import { useState } from "react";
import { Link } from "react-router-dom";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { useSiteData } from "../data/SiteDataProvider";
import type { GalleryItem } from "../data/types";

function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (["youtube.com", "m.youtube.com"].includes(host)) return parsed.searchParams.get("v") || (parsed.pathname.startsWith("/embed/") ? parsed.pathname.slice(7).split("/")[0] : null);
  } catch {
    return null;
  }
  return null;
}

function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}

function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export default function Gallery() {
  const { gallery, settings } = useSiteData();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [video, setVideo] = useState<GalleryItem | null>(null);
  const visibleGallery = gallery.length > 0 ? gallery : [
    { id: "fallback-pipe", title: "Pipe system", kind: "photo" as const, image: "/images/products-v2/borewell-casing-pipe.png" },
    { id: "fallback-elbow", title: "Elbow detail", kind: "photo" as const, image: "/images/products-v2/cpvc-elbow-90.png" },
    { id: "fallback-tank", title: "Black water tank", kind: "photo" as const, image: "/images/products-v2/black-tank.png" },
    { id: "fallback-bundle", title: "Pipe bundle", kind: "photo" as const, image: "/images/products-v2/pvc-pipe-bundle.png" },
    { id: "fallback-trap", title: "P-trap detail", kind: "photo" as const, image: "/images/products-v2/pvc-p-trap.png" },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="aurora" /><div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future"><span className="kf-dot" /> GALLERY</div>
          <h1>On site, <span className="grad">across Nepal.</span></h1>
          <p className="sub">Installation photos, product details and video guides from Bharatpur to Nepalgunj — managed live from the admin panel.</p>
        </div>
      </section>

      <section className="gallery-future section-pad">
        <div className="wrap">
          <div className="gallery-video-callout">
            <div><span className="kicker-future">WATCH THE WORK IN MOTION</span><h2>See the products where they are made and used.</h2><p>Choose a video thumbnail to play it here, or visit the Jagadamba Plastic channel for the full library.</p></div>
            <a className="btn btn-primary" href={settings.youtube} target="_blank" rel="noreferrer">Open YouTube <span aria-hidden="true">↗</span></a>
          </div>
          <div className="gallery-grid-future">
            {visibleGallery.map((g) => {
              const embedUrl = g.videoUrl ? youtubeEmbedUrl(g.videoUrl) : null;
              const image = (g.videoUrl && youtubeThumbnailUrl(g.videoUrl)) || g.image;
              return embedUrl ? (
                <button key={g.id} className="g-tile-future g-video-tile" onClick={() => setVideo(g)} style={{ padding: 0 }}>
                  <img src={image} alt={g.title} loading="lazy" /><div className="g-shade" />
                  <svg className="g-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z" /></svg>
                  <span className="g-video-duration">PLAY VIDEO</span><span className="g-label">{g.title.toUpperCase()}</span>
                </button>
              ) : g.videoUrl ? (
                <a key={g.id} href={g.videoUrl} target="_blank" rel="noreferrer" className="g-tile-future g-video-tile">
                  <img src={image} alt={g.title} loading="lazy" /><div className="g-shade" />
                  <svg className="g-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z" /></svg>
                  <span className="g-video-duration">YOUTUBE</span><span className="g-label">{g.title.toUpperCase()}</span>
                </a>
              ) : (
                <button key={g.id} className="g-tile-future" onClick={() => setLightbox(visibleGallery.filter((item) => !item.videoUrl).findIndex((item) => item.id === g.id))} style={{ padding: 0 }}>
                  <img src={g.image} alt={g.title} loading="lazy" /><div className="g-shade" /><span className="g-label">{g.title.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          <div className="gallery-channel-link"><Link to="/contact" className="p-link-future">Have a Jagadamba site to share? Send us the photo <span aria-hidden="true">↗</span></Link><a href={settings.youtube} target="_blank" rel="noreferrer" className="p-link-future">Full gallery &amp; videos on YouTube <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}><div className="wrap"><div className="cta-band"><div><h2>Installed something with our products?</h2><p>We'd love to feature your site — send photos through the contact page.</p></div><Link to="/contact" className="btn btn-primary">Share your site</Link></div></div></section>

      <GalleryLightbox items={visibleGallery.filter((g) => !g.videoUrl)} index={lightbox} onClose={() => setLightbox(null)} />
      {video?.videoUrl && youtubeEmbedUrl(video.videoUrl) && <div className="video-modal" role="dialog" aria-modal="true" aria-label={`${video.title} video`} onClick={(event) => { if (event.target === event.currentTarget) setVideo(null); }}>
        <div className="video-modal-card"><button className="video-modal-close" type="button" onClick={() => setVideo(null)} aria-label="Close video">✕</button><div className="video-frame"><iframe src={youtubeEmbedUrl(video.videoUrl) ?? undefined} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><div className="video-modal-footer"><strong>{video.title}</strong><a href={video.videoUrl} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div></div>
      </div>}
    </>
  );
}
