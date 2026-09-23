import { useState } from "react";
import type { FormEvent } from "react";
import { submitEnquiry } from "../data/backend";
import { PRODUCT_CATEGORIES } from "../data/types";

const INTERESTS = [...PRODUCT_CATEGORIES, "Become a dealer", "Other"];

export function EnquiryForm({ defaultInterest, bare }: { defaultInterest?: string; bare?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(defaultInterest ?? INTERESTS[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }
    setBusy(true);
    try {
      submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        interest,
        message: message.trim(),
      });
      setSent(true);
      setError("");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Something went wrong — please call us instead.");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <label htmlFor="enq-name">NAME</label>
        <input
          id="enq-name"
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="enq-phone">PHONE</label>
        <input
          id="enq-phone"
          type="text"
          placeholder="98XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="enq-interest">INTEREST</label>
        <select id="enq-interest" value={interest} onChange={(e) => setInterest(e.target.value)}>
          {INTERESTS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="enq-message">MESSAGE</label>
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
