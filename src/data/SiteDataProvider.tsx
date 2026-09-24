import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ConvexProvider, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { convexEnabled, getConvexClient } from "./convexClient";
import * as local from "./store";
import { buildSeedData } from "./seed";
import { convexAdminOps, localAdminOps, type AdminOps } from "./backend";
import type { HeroChipLayout, SiteContent, SiteData } from "./types";
import { DEFAULT_CONTENT } from "./types";

export type BackendMode = "convex" | "local";

export interface ReadModel {
  products: SiteData["products"];
  gallery: SiteData["gallery"];
  reviews: SiteData["reviews"];
  enquiries: SiteData["enquiries"];
  settings: SiteData["settings"];
  content: SiteContent;
  heroLayout: HeroChipLayout | undefined;
  ready: boolean;
}

interface Ctx extends ReadModel {
  mode: BackendMode;
}

const DataContext = createContext<Ctx | null>(null);

export function useSiteData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useSiteData must be used inside <SiteDataProvider>");
  return ctx;
}

export function useAdminOps(passcode: string): AdminOps {
  return convexEnabled ? convexAdminOps(passcode) : localAdminOps;
}

export function useBackendMode(): BackendMode {
  return convexEnabled ? "convex" : "local";
}

/* ---------------- local (localStorage) model ---------------- */

function LocalModel(): ReadModel {
  const [data, setData] = useState<SiteData>(() => local.getSiteData());
  useEffect(() => {
    return local.subscribe(() => setData({ ...local.getSiteData() }));
  }, []);
  return {
    ...data,
    content: { ...DEFAULT_CONTENT, ...(data.content ?? {}) },
    heroLayout: data.heroLayout,
    ready: true,
  };
}

/* ---------------- Convex model ---------------- */

function ConvexModel(): ReadModel {
  const products = useQuery(api.site.listProducts) as unknown as SiteData["products"] | undefined;
  const gallery = useQuery(api.site.listGallery) as unknown as SiteData["gallery"] | undefined;
  const reviews = useQuery(api.site.listAllReviews) as unknown as SiteData["reviews"] | undefined;
  const enquiries = useQuery(api.site.listEnquiries) as unknown as SiteData["enquiries"] | undefined;
  const settings = useQuery(api.site.getSettings) as unknown as SiteData["settings"] | undefined;
  const content = useQuery(api.site.getContent) as unknown as SiteContent | null | undefined;
  const heroLayout = useQuery(api.site.getHeroLayout) as unknown as HeroChipLayout | null | undefined;

  const ready =
    products !== undefined &&
    gallery !== undefined &&
    reviews !== undefined &&
    enquiries !== undefined &&
    settings !== undefined &&
    content !== undefined &&
    heroLayout !== undefined;

  const [seedDone, setSeedDone] = useState(false);
  useEffect(() => {
    if (!ready || seedDone) return;
    setSeedDone(true);
    if (products.length === 0 && gallery.length === 0) {
      const client = getConvexClient();
      const seed = buildSeedData();
      client
        ?.mutation(api.site.seedIfEmpty, {
          products: seed.products,
          gallery: seed.gallery,
          reviews: seed.reviews,
          settings: Object.entries(seed.settings).map(([key, value]) => ({ key, value })),
          content: seed.content,
        })
        .catch(() => {});
    }
  }, [ready, products, gallery, seedDone]);

  return {
    products: products ?? [],
    gallery: gallery ?? [],
    reviews: reviews ?? [],
    enquiries: enquiries ?? [],
    settings: settings ?? buildSeedData().settings,
    content: content ? { ...DEFAULT_CONTENT, ...content } : DEFAULT_CONTENT,
    heroLayout: heroLayout ?? undefined,
    ready,
  };
}

/* ---------------- provider ---------------- */

export function SiteDataProvider({ children }: { children: ReactNode }) {
  if (!convexEnabled) {
    return <LocalOnlyProvider>{children}</LocalOnlyProvider>;
  }

  const client = getConvexClient()!;
  return (
    <ConvexProvider client={client}>
      <ConvexBridge>{children}</ConvexBridge>
    </ConvexProvider>
  );
}

function LocalOnlyProvider({ children }: { children: ReactNode }) {
  const model = LocalModel();
  return <DataContext.Provider value={{ ...model, mode: "local" }}>{children}</DataContext.Provider>;
}

/** Lives inside ConvexProvider so its useQuery calls hit the Convex backend. */
function ConvexBridge({ children }: { children: ReactNode }) {
  const model = ConvexModel();
  return <DataContext.Provider value={{ ...model, mode: "convex" }}>{children}</DataContext.Provider>;
}
