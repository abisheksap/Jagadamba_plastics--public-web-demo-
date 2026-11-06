import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DEALERS, PROVINCES } from "../data/dealers";
import { useSiteData } from "../data/SiteDataProvider";
import { priceSummary } from "../data/pricing";
import type { DocumentItem, Product, SiteSettings } from "../data/types";

type ReplyLink = { label: string; to: string };
type Reply = { text: string; links?: ReplyLink[]; followUps?: string[] };
type ChatMessage = { id: string; from: "assistant" | "visitor"; text: string; links?: ReplyLink[]; followUps?: string[] };

const QUICK_REPLIES = ["Product guide", "Prices", "Find a dealer", "Delivery", "Certificates", "Contact details"];

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

const STOP_WORDS = new Set([
  "the", "and", "for", "what", "which", "with", "you", "your", "are", "have", "can", "how", "much", "does", "need", "want",
  "tell", "about", "please", "any", "list", "show", "give", "price", "prices", "rate", "rates", "cost", "size", "sizes", "available",
  "there", "this", "that", "from", "ask", "get", "buy", "looking", "info", "details",
]);

/** Best matching products for free text, scored on name, category and tagline. */
function matchProducts(query: string, products: Product[], limit = 3): Product[] {
  const tokens = query.split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return [];
  return products
    .map((p) => {
      const name = p.name.toLowerCase();
      const rest = `${p.category} ${p.tagline}`.toLowerCase();
      const score = tokens.reduce((n, t) => n + (name.includes(t) ? 2 : rest.includes(t) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || a.p.sortOrder - b.p.sortOrder)
    .filter((x, _i, all) => x.score >= all[0].score * 0.6)
    .slice(0, limit)
    .map((x) => x.p);
}

const productLine = (p: Product, showPrices: boolean) => {
  const price = priceSummary(p, showPrices);
  return price ? `${p.name} (${price.replace(/^From /, "from ")})` : p.name;
};

const MENU = "products and sizes, prices, dealers by province, delivery, bulk orders, certificates, the quote list, our company, the gallery or how to contact us";

interface Context {
  settings: SiteSettings;
  products: Product[];
  documents: DocumentItem[];
}

/** Keyword guidance. Every answer is built from the data shown on the website; nothing here is invented. */
function assistantReply(input: string, ctx: Context): Reply {
  const { settings, products, documents } = ctx;
  const q = input.toLowerCase().normalize("NFC");
  const has = (re: RegExp) => re.test(q);
  const showPrices = settings.showPrices !== false;

  // ---- greetings, thanks, help -------------------------------------------------
  if (has(/^(hi|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b|नमस्ते|नमस्कार/)) {
    return { text: `Namaste! I can help with ${MENU}.`, followUps: ["Product guide", "Prices", "Find a dealer"] };
  }
  if (has(/\b(thanks|thank you|thx|dhanyabad|dhanyabaad)\b|धन्यवाद/)) {
    return { text: "You're welcome! If you need anything else, just ask — or call our team any time.", followUps: ["Contact details", "Find a dealer"] };
  }
  if (has(/\b(bye|goodbye|see you)\b/)) {
    return { text: "Goodbye, and thank you for visiting Jagadamba Plastic!" };
  }
  if (has(/\b(help|menu|options|what can you do|topics)\b|सहयोग|मद्दत/)) {
    return { text: `I can answer questions about ${MENU}.`, followUps: ["Product guide", "Certificates", "Delivery"] };
  }

  // ---- quote list / enquiry flow ------------------------------------------------
  if (has(/quote list|add to quote|how (do|can) i (get|request|ask for) (a )?quot|request (a )?quot|get (a )?quot|enquir|inquir/)) {
    return {
      text: "Open any product, press “Add to quote”, then send everything in one enquiry from the Contact page. Your list is saved on this device, so you can keep browsing. Our team replies within one working day.",
      links: [{ label: "Browse products", to: "/products" }, { label: "Send an enquiry", to: "/contact#quote" }],
      followUps: ["Prices", "Bulk orders"],
    };
  }

  // ---- size / specification lookups ----------------------------------------------
  const mm = q.match(/(\d{2,3})\s?(?:mm|millimet)/);
  if (mm) {
    const needle = `${mm[1]}mm`;
    const kind = has(/pipe/) ? /pipe/i : has(/fitting|elbow|tee|coupler|valve|trap|union|reducer/) ? /fitting/i : has(/tank/) ? /tank/i : null;
    const found = products.filter(
      (p) => (!kind || kind.test(p.category)) && (p.variants ?? []).some((v) => v.size.toLowerCase().replace(/\s/g, "").includes(needle)),
    );
    if (found.length > 0) {
      const names = found.slice(0, 5).map((p) => productLine(p, showPrices)).join("; ");
      return {
        text: `${needle} is available in: ${names}${found.length > 5 ? ` and ${found.length - 5} more` : ""}. Open a product to see every size, pressure rating and rate.`,
        links: [{ label: `Search “${mm[1]}mm”`, to: `/products?q=${mm[1]}mm` }],
        followUps: ["Delivery", "Bulk orders"],
      };
    }
    return {
      text: `I couldn't find ${needle} in the published price list. Sizes vary by product, so please check the Products page or call ${settings.phone} and we'll confirm.`,
      links: [{ label: "Browse products", to: "/products" }],
    };
  }
  if (has(/pressure|kgf|\bpn\s?\d|\bsdr\b|\bpsi\b|\bbar\b|class [cde]\b/)) {
    const withSpec = products.filter((p) => (p.variants ?? []).some((v) => v.spec)).slice(0, 4).map((p) => p.name);
    return {
      text: `Each product page lists its size and pressure rating (for example kgf/cm² or SDR) in the price table.${withSpec.length ? ` Good places to start: ${withSpec.join(", ")}.` : ""} For a specific duty, call ${settings.phone} and our team will advise.`,
      links: [{ label: "Browse products", to: "/products" }],
      followUps: ["Prices", "Certificates"],
    };
  }

  // ---- pricing -----------------------------------------------------------------
  if (has(/price|rate|cost|quotation|how much|kati|मूल्य|रेट|मोल|कति/)) {
    const hit = matchProducts(q, products, 3);
    if (hit.length > 0 && showPrices) {
      return {
        text: `${hit.map((p) => productLine(p, true)).join("; ")}. Rates are per the ${settings.priceListDate} price list, and each product page has the full size-by-size table. For bulk pricing, send an enquiry.`,
        links: hit.slice(0, 2).map((p) => ({ label: p.name, to: `/products/${p.id}` })),
        followUps: ["Bulk orders", "Delivery"],
      };
    }
    return {
      text: showPrices
        ? `Our catalogue carries size-by-size rates from the ${settings.priceListDate} price list. Open any product to see its table, or add items to your quote list for a dealer quotation.`
        : "Please open Products for the current catalogue, or send an enquiry and our team will share the rate information.",
      links: [{ label: "Browse products", to: "/products" }, { label: "Get a quote", to: "/contact#quote" }],
      followUps: ["Bulk orders", "Delivery"],
    };
  }

  // ---- bulk / projects ---------------------------------------------------------
  if (has(/bulk|wholesale|project|contractor|large order|quantity|minimum|moq|tender/)) {
    return {
      text: `Bulk and project orders are handled directly by our sales team. Send the product, size and quantity (the quote list does this for you) or call ${settings.phone}, and we'll reply with rates and delivery within one working day.`,
      links: [{ label: "Send an enquiry", to: "/contact#quote" }],
      followUps: ["Delivery", "Find a dealer"],
    };
  }

  // ---- certificates / documents ---------------------------------------------------
  if (has(/certif|iso\b|\bns\b|nepal standard|standard|licen[cs]e|registration|registered|document|pan\b|vat\b|quality|test report|approved|authentic|genuine/)) {
    const titles = documents.map((d) => d.title);
    return {
      text: `Our products are manufactured to Nepal Standard (NS) with ISO-aligned quality checks.${titles.length ? ` Documents on file: ${titles.join("; ")}.` : ""} You can view them in the “Our documents” section on the home page.`,
      links: [{ label: "Our documents", to: "/#documents" }],
      followUps: ["Our company", "Contact details"],
    };
  }

  // ---- dealers / provinces ---------------------------------------------------------
  const province = PROVINCES.find((p) => q.includes(p.toLowerCase())) ?? (has(/province\s?1\b|\bprovince one\b/) ? "Koshi" : has(/province\s?2\b|\bprovince two\b/) ? "Madhesh" : has(/province\s?3\b/) ? "Bagmati" : has(/province\s?4\b/) ? "Gandaki" : has(/province\s?5\b/) ? "Lumbini" : has(/province\s?6\b/) ? "Karnali" : has(/province\s?7\b/) ? "Sudurpashchim" : null);
  if (province || has(/dealer|distribut|stockist|retail|shop|where (can|do) i buy|nearest|near me|territory|franchise|become a dealer|डिलर|वितरक|पसल/)) {
    if (province) {
      const listed = DEALERS.filter((d) => d.province === province);
      return {
        text: listed.length
          ? `Dealers in ${province}: ${listed.map((d) => `${d.name} (${d.district}, ${d.phone})`).join("; ")}.`
          : `We supply ${province} from our Bharatpur plant. Call ${settings.phone} and we'll connect you with the nearest stockist or arrange direct delivery.`,
        links: [{ label: "Find a dealer", to: "/contact#dealer-finder" }],
        followUps: ["Delivery", "Become a dealer"],
      };
    }
    return {
      text: `We supply dealers across all seven provinces, district 1 to 77. Pick your province on the dealer finder, or call ${settings.phone} to discuss territory, stock and delivery. Dealer enquiries are welcome.`,
      links: [{ label: "Find a dealer", to: "/contact#dealer-finder" }, { label: "Dealer enquiry", to: "/contact" }],
      followUps: ["Delivery", "Bulk orders"],
    };
  }

  // ---- delivery ----------------------------------------------------------------
  if (has(/deliver|shipping|transport|dispatch|freight|courier|lead time|how long|कहिले|ढुवानी/)) {
    return {
      text: `Our plant and office are at ${settings.address}. Delivery is arranged with the sales team: send your location and quantity (or call ${settings.phone}) and we'll confirm cost and timing.`,
      links: [{ label: "Send an enquiry", to: "/contact#quote" }],
      followUps: ["Find a dealer", "Bulk orders"],
    };
  }

  // ---- contact / location ----------------------------------------------------------
  if (has(/contact|phone|call|email|mail|address|location|where is|reach|visit|factory|plant|office|map|hours|open|timing|सम्पर्क|फोन|ठेगाना/)) {
    return {
      text: `Phone ${settings.phone}${settings.phoneAlt ? ` or ${settings.phoneAlt}` : ""} · ${settings.email} · ${settings.address}. For opening hours please call; written enquiries are answered within one working day.`,
      links: [{ label: `Call ${settings.phone}`, to: telHref(settings.phone) }, { label: "Contact page", to: "/contact" }],
      followUps: ["Find a dealer", "Delivery"],
    };
  }

  // ---- company / careers / reviews / gallery -----------------------------------------
  if (has(/career|job|vacan|hiring|recruit|work with|apply/)) {
    return { text: "For careers, send us a message through the Contact page and mention the role you're interested in — our team answers within one working day.", links: [{ label: "Contact page", to: "/contact" }] };
  }
  if (has(/review|feedback|testimonial|rating|complain/)) {
    return { text: "You can read what dealers say and share your own experience on the Reviews page. New reviews appear after approval.", links: [{ label: "Reviews", to: "/reviews" }] };
  }
  if (has(/gallery|video|youtube|photo|picture|image|installation|site visit/)) {
    return { text: "The Gallery has product and installation photos from sites across Nepal, plus a link to our YouTube channel for factory and product videos.", links: [{ label: "Gallery", to: "/gallery" }], followUps: ["Product guide"] };
  }
  if (has(/founded|history|since|company|about|manakamana|group|who are you|story|milestone|established|\bwho\b/)) {
    return {
      text: "Jagadamba Plastic Industries began manufacturing in 2063 B.S. in Bharatpur, Chitwan, as a milestone company of the Manakamana Group. We make HDPE, PVC and CPVC pipes, fittings and water tanks and supply dealers in every province.",
      links: [{ label: "About us", to: "/about" }],
      followUps: ["Certificates", "Find a dealer"],
    };
  }

  // ---- installation advice (kept general on purpose) -----------------------------------
  if (has(/install|joint|glue|cement|solvent|weld|fit\b|plumb|how to use|instruction|manual/)) {
    return {
      text: `Correct jointing and installation depend on the product and pressure class, so I'd rather not guess. Call ${settings.phone} and our team will advise, and see the Gallery for installed examples.`,
      links: [{ label: "Gallery", to: "/gallery" }, { label: "Contact", to: "/contact" }],
    };
  }

  // ---- products (specific, then general) -----------------------------------------------
  const hit = matchProducts(q, products, 4);
  if (hit.length > 0) {
    return {
      text: `Matching products: ${hit.map((p) => productLine(p, showPrices)).join("; ")}. Open one to see sizes, pressure ratings and the full rate table.`,
      links: hit.slice(0, 3).map((p) => ({ label: p.name, to: `/products/${p.id}` })),
      followUps: ["Prices", "Add to quote"],
    };
  }
  if (has(/tank|storage|ट्याङ्की|ट्यांकी/)) {
    return { text: "Our water tanks come in several capacities and colours for rooftop and ground storage. The Water tanks group lists capacities and per-litre rates.", links: [{ label: "Water tanks", to: "/products?group=tanks" }], followUps: ["Prices", "Delivery"] };
  }
  if (has(/fitting|elbow|tee\b|coupler|coupling|valve|trap|union|bend|reducer|socket|adaptor|adapter/)) {
    return { text: "We make PVC and CPVC fittings — elbows, tees, couplers, valves, traps and unions — to match our pipes.", links: [{ label: "Fittings", to: "/products?group=fittings" }], followUps: ["Prices", "Delivery"] };
  }
  if (has(/pipe|hdpe|pvc|cpvc|upvc|borewell|casing|drain|irrigation|sewer|पाइप/)) {
    return { text: "Our pipe range covers HDPE (supply and irrigation), uPVC (plumbing and distribution), CPVC (hot and cold lines), borewell casing and underground drainage.", links: [{ label: "Pipes", to: "/products?group=pipes" }], followUps: ["Prices", "Certificates"] };
  }
  if (has(/product|catalog|catalogue|range|item|what do you (make|sell|manufacture)|सामान|उत्पादन/)) {
    return {
      text: "We manufacture HDPE, PVC and CPVC pipes, PVC and CPVC fittings, and water tanks. The Products page groups everything into Pipes, Fittings and Water tanks, with size-by-size rates.",
      links: [{ label: "All products", to: "/products" }],
      followUps: ["Prices", "Certificates", "Find a dealer"],
    };
  }

  return {
    text: `I'm a keyword guide, so I may have missed that. I can help with ${MENU}. For anything else, call ${settings.phone}.`,
    followUps: ["Product guide", "Prices", "Contact details"],
  };
}

export function CompanyAssistant({ settings }: { settings: SiteSettings }) {
  const { products, documents } = useSiteData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "assistant",
      text: "Namaste! I am the Jagadamba assistant. Ask me about products, sizes, prices, dealers, delivery, certificates or our company.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);
  const ctx = useMemo<Context>(() => ({ settings, products, documents }), [settings, products, documents]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // always keep the newest message (or the typing indicator) in view
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    // the typing indicator disappearing can cut a smooth scroll short, so finish the job once it settles
    const settle = window.setTimeout(() => { el.scrollTop = el.scrollHeight; }, 520);
    return () => window.clearTimeout(settle);
  }, [messages, typing, open]);

  const send = (text: string) => {
    const clean = text.trim().slice(0, 300);
    if (!clean || typing) return;
    const id = (n: number) => `m-${Date.now()}-${counter.current++}-${n}`;
    setMessages((current) => [...current.map((m) => ({ ...m, followUps: undefined })), { id: id(1), from: "visitor", text: clean }]);
    setInput("");
    setTyping(true);
    timer.current = window.setTimeout(() => {
      const reply = assistantReply(clean, ctx);
      setMessages((current) => [...current, { id: id(2), from: "assistant", ...reply }]);
      setTyping(false);
    }, 450);
  };

  const lastFollowUps = messages[messages.length - 1]?.followUps;

  return (
    <div className={`company-assistant${open ? " open" : ""}`}>
      {open && (
        <section className="assistant-panel" aria-label="Jagadamba company assistant">
          <header className="assistant-header">
            <div>
              <span className="assistant-kicker">Jagadamba assistant</span>
              <strong>How can we help?</strong>
            </div>
            <button className="assistant-close" type="button" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
          </header>
          <div className="assistant-messages" ref={listRef} aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`assistant-message ${message.from}`}>
                {message.text}
                {message.links && message.links.length > 0 && (
                  <span className="assistant-links">
                    {message.links.map((link) =>
                      link.to.startsWith("tel:") ? (
                        <a key={link.label} href={link.to}>{link.label}</a>
                      ) : (
                        <Link key={link.label} to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>
                      ),
                    )}
                  </span>
                )}
              </div>
            ))}
            {typing && (
              <div className="assistant-message assistant assistant-typing" aria-label="The assistant is typing">
                <i /><i /><i />
              </div>
            )}
          </div>
          <div className="assistant-quick-replies" aria-label="Quick questions">
            {(lastFollowUps && lastFollowUps.length ? lastFollowUps : QUICK_REPLIES).map((reply) => (
              <button key={reply} type="button" onClick={() => send(reply)} disabled={typing}>{reply}</button>
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
              placeholder="Ask about products, sizes, delivery…"
              aria-label="Message the Jagadamba assistant"
              maxLength={300}
            />
            <button type="submit" aria-label="Send message" disabled={typing || !input.trim()}>↗</button>
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
