import { useState } from "react";
import type { FormEvent } from "react";
import { submitEnquiry } from "../data/backend";
import { PRODUCT_CATEGORIES } from "../data/types";
import { useQuote } from "../data/QuoteProvider";

const INTERESTS = [...PRODUCT_CATEGORIES, "Become a dealer", "Other"];

export function EnquiryForm({ defaultInterest, bare }: { defaultInterest?: string; bare?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(defaultInterest ?? INTERESTS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [trap, setTrap] = useState(""); // honeypot: hidden from people, bots fill it in
  const quote = useQuote();
  // a product name passed from a detail page is not one of the category options; show it as the first choice
  const options = defaultInterest && !INTERESTS.includes(defaultInterest) ? [defaultInterest, ...INTERESTS] : INTERESTS;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        interest,
        hp: trap,
        message: [
          quote.items.length ? `Quote request for: ${quote.items.map((i) => i.name).join(", ")}.` : "",
          message.trim(),
        ].filter(Boolean).join("\n\n"),
      });
      quote.clear();
      setSent(true);
      setName("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please call us instead.");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <form onSubmit={onSubmit}>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="enq-website">Leave this field empty</label>
        <input id="enq-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>
      {quote.items.length > 0 && (
        <div className="quote-list" id="quote" aria-label="Your quote list">
          <div className="quote-list-head">
            <b>Your quote list</b>
            <span>{quote.items.length} {quote.items.length === 1 ? "product" : "products"}</span>
            <button type="button" onClick={quote.clear}>Clear</button>
          </div>
          <ul>
            {quote.items.map((item) => (
              <li key={item.id}>
                {item.image && <img src={item.image} alt="" loading="lazy" width={36} height={36} />}
                <span>{item.name}</span>
                <button type="button" aria-label={`Remove ${item.name}`} onClick={() => quote.remove(item.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-row">
        <label htmlFor="enq-name">Name</label>
        <input
          id="enq-name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="enq-phone">Phone</label>
        <input
          id="enq-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="enq-interest">Interest</label>
        <select id="enq-interest" value={interest} onChange={(e) => setInterest(e.target.value)}>
          {options.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="enq-message">Message</label>
        <textarea
          id="enq-message"
          rows={3}
          placeholder="Tell us what you need"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button className="form-submit" type="submit" disabled={busy}>
        {sent ? "Enquiry sent ✓" : "Send enquiry"}
      </button>
      <div className={`form-note${error ? " error" : ""}`}>
        {error || (sent ? "Thanks — our sales team will follow up shortly." : "")}
      </div>
    </form>
  );

  return bare ? body : <div className="form-box">{body}</div>;
}
