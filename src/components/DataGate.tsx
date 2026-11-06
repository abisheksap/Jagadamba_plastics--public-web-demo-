import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSiteData } from "../data/SiteDataProvider";
import { PageLoader } from "./Lazy";

/**
 * Holds back the page until the site's data has arrived from the server, so visitors never see
 * empty grids or "0 products" for a moment. If the server cannot be reached, it says so
 * after a few seconds instead of spinning forever.
 */
export function DataGate({ children, minHeight = "100vh" }: { children: ReactNode; minHeight?: string }) {
  const { ready } = useSiteData();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (ready) return <>{children}</>;
  return (
    <div className="data-gate" style={{ minHeight }}>
      <PageLoader label="Loading" minHeight="auto" />
      {slow && (
        <div className="data-gate-slow" role="alert">
          <p>This is taking longer than usual. Please check your internet connection.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
