import { ReviewForm } from "../components/ReviewForm";
import { useSiteData } from "../data/SiteDataProvider";
import { pickApproved } from "../data/backend";

export default function Reviews() {
  const { reviews } = useSiteData();
  const approved = pickApproved(reviews);

  return (
    <>
      <section className="page-hero">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="kicker-future">
            <span className="kf-dot" />
            CUSTOMER REVIEWS
          </div>
          <h1>
            What our dealers &amp; <span className="grad">customers say.</span>
          </h1>
          <p className="sub">
            {approved.length} published review{approved.length === 1 ? "" : "s"} from the people who
            stock, install and live with our products.
          </p>
        </div>
      </section>

      <section className="reviews-future section-pad">
        <div className="wrap">
          {approved.length === 0 ? (
            <div className="empty-state">No published reviews yet — be the first to share your experience below.</div>
          ) : (
            <div className="review-grid-future">
              {approved.map((r) => (
                <div key={r.id} className="r-card-future">
                  <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <p className="quote">“{r.quote}”</p>
                  <div className="who">
                    <div className="name">{r.name}</div>
                    {r.business && <div className="biz">{r.business}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-glass" style={{ marginTop: 48 }}>
            <h3 style={{ color: "#fff", fontSize: 22 }}>Worked with our products? Leave a review.</h3>
            <p style={{ color: "var(--text-mid)", fontSize: 14, marginTop: 8, maxWidth: 560 }}>
              Dealers, contractors and homeowners — share your experience. Reviews are checked by
              our team before they appear on this page.
            </p>
            <ReviewForm bare />
          </div>
        </div>
      </section>
    </>
  );
}
