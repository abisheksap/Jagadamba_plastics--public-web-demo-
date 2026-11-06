import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ConvexProvider, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { convexEnabled, getConvexClient } from "./convexClient";
import { adminCredential, signOut } from "./adminAuth";
import * as local from "./store";
import { buildSeedData } from "./seed";
import { convexAdminOps, localAdminOps, type AdminOps } from "./backend";
import { productImageFor } from "./productImages";
import type { HeroChipLayout, SiteContent, SiteData } from "./types";
import { DEFAULT_CONTENT } from "./types";

export type BackendMode = "convex" | "local";

export interface ReadModel {
  products: SiteData["products"];
  gallery: SiteData["gallery"];
  documents: NonNullable<SiteData["documents"]>;
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
    documents: data.documents ?? [],
    content: { ...DEFAULT_CONTENT, ...(data.content ?? {}) },
    heroLayout: data.heroLayout,
    ready: true,
  };
}

/* ---------------- Convex model ---------------- */

function ConvexModel(): ReadModel {
  const products = useQuery(api.site.listProducts) as unknown as SiteData["products"] | undefined;
  const gallery = useQuery(api.site.listGallery) as unknown as SiteData["gallery"] | undefined;
  const documents = useQuery(api.site.listDocuments) as unknown as SiteData["documents"] | undefined;
  // visitors only ever receive public data: approved reviews, never enquiries or pending reviews
  const reviews = useQuery(api.site.listApprovedReviews) as unknown as SiteData["reviews"] | undefined;
  const settings = useQuery(api.site.getSettings) as unknown as SiteData["settings"] | undefined;
  const content = useQuery(api.site.getContent) as unknown as SiteContent | null | undefined;
  const heroLayout = useQuery(api.site.getHeroLayout) as unknown as HeroChipLayout | null | undefined;

  const ready =
    products !== undefined &&
    gallery !== undefined &&
    documents !== undefined &&
    reviews !== undefined &&
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
          documents: seed.documents,
          reviews: seed.reviews,
          settings: Object.entries(seed.settings).map(([key, value]) => ({ key, value })),
          content: seed.content,
        })
        .catch(() => {});
    } else if (documents && documents.length === 0) {
      // existing site that predates "Our documents": add the starter entries once
      getConvexClient()
        ?.mutation(api.site.seedDocumentsIfEmpty, { documents: buildSeedData().documents ?? [] })
        .catch(() => {});
    }
  }, [ready, products, gallery, documents, seedDone]);

  return {
    // Convex may contain legacy image paths from the first catalog seed. Resolve
    // them at the public read boundary so every page receives a shipped asset.
    products: (products ?? []).map((product) => ({
      ...product,
      image: productImageFor(product),
    })),
    gallery: gallery ?? [],
    documents: documents ?? [],
    reviews: reviews ?? [],
    enquiries: [],
    settings: settings ?? buildSeedData().settings,
    content: content ? { ...DEFAULT_CONTENT, ...content } : DEFAULT_CONTENT,
    heroLayout: heroLayout ?? undefined,
    ready,
  };
}

/* ---------------- admin data (signed-in sessions only) ---------------- */

/**
 * Wrap the admin panel in this. In Convex mode it adds what only an admin may read (every enquiry and
 * every review including pending ones) on top of the public data, using the admin session token.
 * Visitors' browsers never request these queries.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const base = useSiteData();
  if (base.mode !== "convex") return <>{children}</>;
  return <ConvexAdminData base={base}>{children}</ConvexAdminData>;
}

function ConvexAdminData({ base, children }: { base: Ctx; children: ReactNode }) {
  const token = adminCredential();
  const args = token ? { token } : "skip";
  const enquiries = useQuery(api.site.listEnquiries, args) as unknown as SiteData["enquiries"] | null | undefined;
  const reviews = useQuery(api.site.listAllReviews, args) as unknown as SiteData["reviews"] | null | undefined;

  // the server answers null when the session is no longer valid: sign out so the login page appears
  const rejected = enquiries === null || reviews === null;
  useEffect(() => {
    if (rejected) signOut();
  }, [rejected]);

  const value: Ctx = {
    ...base,
    enquiries: enquiries ?? [],
    reviews: reviews ?? base.reviews,
    ready: base.ready && enquiries !== undefined && reviews !== undefined,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
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
