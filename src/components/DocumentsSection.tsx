import { useEffect, useRef, useState } from "react";
import { useSiteData } from "../data/SiteDataProvider";
import { DOCUMENT_KINDS } from "../data/types";
import type { DocumentItem } from "../data/types";

const kindLabel = (kind: string) => DOCUMENT_KINDS.find((k) => k.id === kind)?.label ?? "Document";

/** Placeholder artwork for entries that have no scan yet. */
function PaperGlyph() {
  return (
    <svg className="doc-glyph" viewBox="0 0 120 150" fill="none" aria-hidden="true">
      <rect x="10" y="8" width="100" height="134" rx="6" fill="currentColor" opacity="0.07" />
      <rect x="10" y="8" width="100" height="134" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <path d="M28 34h64M28 48h64M28 62h40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <circle cx="82" cy="108" r="16" stroke="var(--red)" strokeWidth="2.5" />
      <path d="m75 108 5 5 9-10" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentViewer({ doc, onClose }: { doc: DocumentItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  const meta = [doc.issuer, doc.issuedOn && `Issued ${doc.issuedOn}`, doc.validUntil && `Valid until ${doc.validUntil}`].filter(Boolean) as string[];
  return (
    <div className="doc-viewer" role="dialog" aria-modal="true" aria-label={doc.title} onClick={onClose}>
      <div className="doc-viewer-panel" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="doc-viewer-close" aria-label="Close" onClick={onClose}>×</button>
        <div className="doc-viewer-image">{doc.image ? <img loading="lazy" decoding="async" src={doc.image} alt={doc.title} /> : <PaperGlyph />}</div>
        <div className="doc-viewer-info">
          <span className="doc-kind-tag">{kindLabel(doc.kind)}</span>
          <h3>{doc.title}</h3>
          {doc.note && <p>{doc.note}</p>}
          {meta.length > 0 && <ul>{meta.map((m) => <li key={m}>{m}</li>)}</ul>}
          {doc.fileUrl && <a className="btn btn-primary" href={doc.fileUrl} target="_blank" rel="noreferrer">Open PDF</a>}
        </div>
      </div>
    </div>
  );
}

/** "Our documents": certificates, registrations and reports. Managed in Admin → Documents. */
export function DocumentsSection() {
  const { documents } = useSiteData();
  const [open, setOpen] = useState<DocumentItem | null>(null);
  if (documents.length === 0) return null;
  const sorted = [...documents].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  return (
    <section className="documents-section" id="documents" aria-labelledby="documents-title">
      <div className="wrap">
        <div className="documents-head">
          <div>
            <div className="kicker-future">Our documents</div>
            <h2 id="documents-title">Certified, registered <span className="grad">and on record.</span></h2>
          </div>
          <p>The standards, registrations and reports behind every pipe, fitting and tank we make. Open a document to read it in full.</p>
        </div>

        <ul className="documents-grid">
          {sorted.map((d) => {
            const viewable = !!(d.image || d.fileUrl);
            const body = (
              <>
                <span className="doc-paper">
                  {d.image ? <img src={d.image} alt="" loading="lazy" /> : <PaperGlyph />}
                  <span className="doc-kind-tag">{kindLabel(d.kind)}</span>
                </span>
                <span className="doc-body">
                  <b>{d.title}</b>
                  {d.issuer && <small>{d.issuer}</small>}
                  {(d.issuedOn || d.validUntil) && <em>{[d.issuedOn && `Issued ${d.issuedOn}`, d.validUntil && `Valid until ${d.validUntil}`].filter(Boolean).join(" · ")}</em>}
                  {!d.issuer && d.note && <small>{d.note}</small>}
                </span>
              </>
            );
            return (
              <li key={d.id}>
                {viewable ? (
                  <button type="button" className="doc-card" onClick={() => setOpen(d)} aria-label={`View ${d.title}`}>{body}</button>
                ) : (
                  <div className="doc-card is-static">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {open && <DocumentViewer doc={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
