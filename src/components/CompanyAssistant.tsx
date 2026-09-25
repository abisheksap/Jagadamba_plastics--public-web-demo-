import { useState } from "react";
import type { SiteSettings } from "../data/types";

type ChatMessage = {
  id: string;
  from: "assistant" | "visitor";
  text: string;
};

const QUICK_REPLIES = ["Product guide", "Dealer enquiry", "Delivery", "Contact details"];

function assistantReply(input: string, settings: SiteSettings): string {
  const query = input.toLowerCase();

  if (/price|rate|cost| quotation|quote/.test(query)) {
    return settings.showPrices
      ? `Our catalogue includes current size and rate tables for ${settings.priceListDate}. Open Products to choose a line, or send an enquiry for a dealer quotation.`
      : `Please open Products for our current catalogue, or send an enquiry and our team will share the relevant rate information.`;
  }
  if (/product|pipe|fitting|tank|catalog|catalogue|size|hdpe|pvc|cpvc/.test(query)) {
    return "We manufacture HDPE, PVC and CPVC pipes, PVC and CPVC fittings, and water tanks. The Products page groups everything by Pipes, Fittings, and Water Tanks.";
  }
  if (/dealer|distribut|wholesale|stock|territory/.test(query)) {
    return `Dealer enquiries are welcome across Nepal. Send an enquiry through Contact or call ${settings.phone} to discuss territory, stock, and delivery.`;
  }
  if (/deliver|shipping|transport|delivery|dispatch/.test(query)) {
    return `Our office is in ${settings.address}. Delivery is arranged with the sales team; call ${settings.phone} or send an enquiry with your location and quantity.`;
  }
  if (/contact|phone|email|address|reach|call/.test(query)) {
    return `You can reach Jagadamba Plastic at ${settings.phone}, ${settings.email}, or ${settings.address}. Our YouTube channel is linked from the Gallery page.`;
  }
  if (/gallery|video|youtube|installation|site/.test(query)) {
    return "The Gallery page keeps product and installation imagery from the team, with a YouTube channel button for factory and product videos.";
  }
  if (/founded|history|year|company|about|certif|standard|iso|ns/.test(query)) {
    return "Jagadamba Plastic began manufacturing in 2063 B.S. in Bharatpur as part of the Manakamana Group. Our plant works to Nepal Standard and ISO-aligned quality checks.";
  }
  if (/hello|hi|hey|namaste/.test(query)) {
    return "Namaste! I can help with products, prices, dealer enquiries, delivery, gallery videos, or company information.";
  }
  return "I can help with products, prices, dealer enquiries, delivery, gallery videos, or company information. Try one of the quick questions above.";
}

export function CompanyAssistant({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "assistant",
      text: "Namaste! I am the Jagadamba assistant. Ask me about products, prices, dealer support, delivery, or our company.",
    },
  ]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const now = Date.now();
    setMessages((current) => [
      ...current,
      { id: `visitor-${now}`, from: "visitor", text: clean },
      { id: `assistant-${now}`, from: "assistant", text: assistantReply(clean, settings) },
    ]);
    setInput("");
  };

  return (
    <div className={`company-assistant${open ? " open" : ""}`}>
      {open && (
        <section className="assistant-panel" aria-label="Jagadamba company assistant">
          <header className="assistant-header">
            <div>
              <span className="assistant-kicker">JAGADAMBA ASSISTANT</span>
              <strong>How can we help?</strong>
            </div>
            <button className="assistant-close" type="button" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </header>
          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`assistant-message ${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="assistant-quick-replies" aria-label="Quick questions">
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} type="button" onClick={() => send(reply)}>{reply}</button>
            ))}
          </div>
          <form
            className="assistant-compose"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about products or delivery…"
              aria-label="Message the Jagadamba assistant"
            />
            <button type="submit" aria-label="Send message">↗</button>
          </form>
          <p className="assistant-note">Keyword-based guidance · For quotes, call {settings.phone}</p>
        </section>
      )}
      <button
        className="message-button assistant-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close company assistant" : "Message the Jagadamba assistant"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11.5a8 8 0 0 1-8 8 8.8 8.8 0 0 1-3.6-.8L4 20l1.3-3.8A7.7 7.7 0 0 1 4 11.5a8 8 0 0 1 16 0Z" />
          <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
        </svg>
        <span>{open ? "Close" : "Message us"}</span>
      </button>
    </div>
  );
}
