import { useEffect, useState } from "react";
import type { GalleryItem } from "../data/types";

export function GalleryLightbox({
  items,
  index,
  onClose,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  useEffect(() => setCurrent(index), [index]);

  useEffect(() => {
    if (current === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c === null ? c : (c + 1) % items.length));
      if (e.key === "ArrowLeft") setCurrent((c) => (c === null ? c : (c - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, items.length, onClose]);

  if (current === null || !items[current]) return null;
  const item = items[current];

  return (
    <div
      className="lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="lb-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      {items.length > 1 && (
        <>
          <button
            className="lb-nav lb-prev"
            aria-label="Previous"
            onClick={() => setCurrent((c) => (c === null ? c : (c - 1 + items.length) % items.length))}
          >
            ‹
          </button>
          <button
            className="lb-nav lb-next"
            aria-label="Next"
            onClick={() => setCurrent((c) => (c === null ? c : (c + 1) % items.length))}
          >
            ›
          </button>
        </>
      )}
      <figure>
        <img src={item.image} alt={item.title} />
        <figcaption>
          {item.title} — {current + 1}/{items.length}
        </figcaption>
      </figure>
    </div>
  );
}

/** Keeps the parent's open-index in sync after lightbox closes. */
export function useLightbox() {
  return useState<number | null>(null);
}
