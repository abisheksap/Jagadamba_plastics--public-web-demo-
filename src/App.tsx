import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { SiteDataProvider, useSiteData } from "./data/SiteDataProvider";
import { useThemeApplier } from "./data/theme";
import { Footer, ScrollTrack, SiteHeader } from "./components/SiteChrome";
import { ScrollToTop } from "./components/ScrollToTop";
import { QuoteProvider } from "./data/QuoteProvider";
import { DataGate } from "./components/DataGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageLoader, useIdle } from "./components/Lazy";
import { ScrollReveal } from "./components/ScrollReveal";
import Home from "./pages/Home";

// Everything except the home page (the first thing most visitors see) loads on demand.
const AdminApp = lazy(() => import("./admin/AdminApp"));
const CompanyAssistant = lazy(() => import("./components/CompanyAssistant").then((m) => ({ default: m.CompanyAssistant })));
const About = lazy(() => import("./pages/About"));
const ProductsPage = lazy(() => import("./pages/Products").then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/Products").then((m) => ({ default: m.ProductDetailPage })));
const Gallery = lazy(() => import("./pages/Gallery"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ThemeRoot() {
  const { settings } = useSiteData();
  useThemeApplier(settings.theme);
  return null;
}

function Chrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { settings } = useSiteData();

  // restart at the top on every navigation; "#section" links scroll smoothly to their section once it exists
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    const id = decodeURIComponent(location.hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 25) {
        window.clearInterval(timer);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [location.pathname, location.hash]);

  return (
    <DataGate>
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollTrack />
      <SiteHeader />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer settings={settings} />
      <Assistant />
      <ScrollReveal />
      <ScrollToTop />
    </DataGate>
  );
}

/** The chat widget is not needed for the first paint: it loads once the browser is idle or the visitor interacts. */
function Assistant() {
  const { settings } = useSiteData();
  const idle = useIdle();
  if (!idle) return null;
  return (
    <Suspense fallback={null}>
      <CompanyAssistant settings={settings} />
    </Suspense>
  );
}

function PublicRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <SiteDataProvider>
      <QuoteProvider>
      <ThemeRoot />
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth/admin-services/admin/*"
            element={
              <Suspense fallback={<PageLoader label="Loading admin" minHeight="100vh" />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Chrome>
                <PublicRoutes />
              </Chrome>
            }
          />
        </Routes>
      </BrowserRouter>
      </QuoteProvider>
    </SiteDataProvider>
    </ErrorBoundary>
  );
}
