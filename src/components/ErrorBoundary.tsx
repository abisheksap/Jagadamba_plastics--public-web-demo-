import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

const RELOAD_FLAG = "jagadamba-chunk-reload";

const isChunkError = (error: unknown) =>
  error instanceof Error && /Loading chunk|dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message);

/**
 * Catches render errors so a bug shows a friendly page instead of a blank screen.
 * After a new deployment an open tab can hold stale file names; that case reloads once automatically.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
          return;
        }
      } catch {
        /* fall through to the message */
      }
    }
    console.error("Unhandled error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-screen" role="alert">
        <img src="/images/logo.png" alt="" width={72} height={72} />
        <h1>Something went wrong</h1>
        <p>Please reload the page. If it keeps happening, call us and we will help right away.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }
}
