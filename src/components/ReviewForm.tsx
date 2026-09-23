import { useState } from "react";
import type { FormEvent } from "react";
import { submitReview } from "../data/backend";

export function ReviewForm({ bare }: { bare?: boolean }) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) {
      setError("Please add your name and a short review.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitReview({ name: name.trim(), business: business.trim(), rating, quote: quote.trim() });
      setSent(true);
      setName("");
      setBusiness("");
      setQuote("");
      setRating(5);
    } catch {
      setError("Something went wrong — please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <label htmlFor="rev-name">YOUR NAME</label>
        <input
          id="rev-name"
          type="text"
          placeholder="e.g. Ram Bahadur Thapa"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rev-biz">BUSINESS / LOCATION (OPTIONAL)</label>
        <input
          id="rev-biz"
          type="text"
          placeholder="e.g. Thapa Hardware, Chitwan"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label>RATING</label>
        <div className="star-picker" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={n <= rating ? "on" : ""}
              onClick={() => setRating(n)}
              role="radio"
              aria-checked={n === rating}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="rev-quote">YOUR REVIEW</label>
        <textarea
          id="rev-quote"
          rows={4}
          placeholder="How did the products hold up?"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
        />
      </div>
      <button className="form-submit" type="submit" disabled={busy}>
        {sent ? "Review submitted ✓" : busy ? "Submitting…" : "Submit review"}
      </button>
      <div className={`form-note${error ? " error" : ""}`}>
        {error || (sent ? "Thank you! Your review is awaiting moderation." : "")}
      </div>
    </form>
  );

  return bare ? body : <div className="form-box">{body}</div>;
}
