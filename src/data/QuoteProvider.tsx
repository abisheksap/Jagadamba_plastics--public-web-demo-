import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/** A lightweight "quote list": visitors collect products, then send them in one enquiry. */
export interface QuoteItem {
  id: string;
  name: string;
  category: string;
  image: string;
}

interface QuoteApi {
  items: QuoteItem[];
  has: (id: string) => boolean;
  add: (item: QuoteItem) => void;
  remove: (id: string) => void;
  toggle: (item: QuoteItem) => void;
  clear: () => void;
}

const STORAGE_KEY = "jagadamba-quote-list";
const MAX_ITEMS = 30;
const QuoteContext = createContext<QuoteApi | null>(null);

function readStored(): QuoteItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i): i is QuoteItem => !!i && typeof i.id === "string" && typeof i.name === "string")
      .map((i) => ({ id: i.id, name: i.name, category: String(i.category ?? ""), image: String(i.image ?? "") }))
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage can be unavailable (private mode); the list still works for this visit */
    }
  }, [items]);

  // keep several open tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setItems(readStored()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: QuoteItem) => {
    setItems((current) => (current.some((i) => i.id === item.id) || current.length >= MAX_ITEMS ? current : [...current, item]));
  }, []);
  const remove = useCallback((id: string) => setItems((current) => current.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const api = useMemo<QuoteApi>(() => ({
    items,
    has: (id) => items.some((i) => i.id === id),
    add,
    remove,
    toggle: (item) => (items.some((i) => i.id === item.id) ? remove(item.id) : add(item)),
    clear,
  }), [items, add, remove, clear]);

  return <QuoteContext.Provider value={api}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteApi {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside <QuoteProvider>");
  return ctx;
}
