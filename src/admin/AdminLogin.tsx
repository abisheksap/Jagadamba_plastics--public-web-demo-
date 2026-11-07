import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MIN_PASSCODE, authMode, localNeedsSetup, resetLocalAdmin, setupLocalPasscode, signIn } from "../data/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const mode = authMode();
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(localNeedsSetup());

  const finish = (ok: boolean, message?: string) => {
    if (ok) navigate("/auth/admin-services/admin", { replace: true });
    else setError(message ?? "Could not sign in.");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (needsSetup) {
        if (passcode !== confirm) return setError("The two passcodes do not match.");
        const res = await setupLocalPasscode(passcode);
        return finish(res.ok, res.ok ? undefined : res.message);
      }
      const res = await signIn(passcode);
      finish(res.ok, res.ok ? undefined : res.message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      setPasscode("");
      setConfirm("");
    }
  };

  const onForget = () => {
    resetLocalAdmin();
    setNeedsSetup(true);
    setError("");
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <img loading="lazy" decoding="async" src="/images/logo.png" alt="" />
          Jagadamba Admin
        </div>

        {mode === "unavailable" ? (
          <>
            <div className="sub">The admin panel is not available on this site because it was built without a backend connection.</div>
            <div className="login-error" role="alert">
              Set VITE_CONVEX_URL when building, then deploy the backend. See DEPLOY.md.
            </div>
          </>
        ) : (
          <>
            <div className="sub">
              {needsSetup
                ? "First run on this computer: create a passcode for the local preview."
                : "Manage products, gallery, documents, reviews, enquiries, content and site appearance."}
            </div>
            <form onSubmit={onSubmit}>
              <div className="admin-field">
                <label htmlFor="passcode">{needsSetup ? "NEW PASSCODE" : "PASSCODE"}</label>
                <input
                  id="passcode"
                  type="password"
                  autoFocus
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  placeholder={needsSetup ? `At least ${MIN_PASSCODE} characters` : "Enter admin passcode"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  maxLength={200}
                />
              </div>
              {needsSetup && (
                <div className="admin-field">
                  <label htmlFor="passcode-confirm">CONFIRM PASSCODE</label>
                  <input id="passcode-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={200} />
                </div>
              )}
              <button type="submit" className="admin-btn primary" style={{ width: "100%", padding: 13 }} disabled={busy || !passcode}>
                {busy ? "Checking…" : needsSetup ? "Create passcode" : "Sign in"}
              </button>
              <div className="login-error" role="alert">{error}</div>
            </form>
            {mode === "local-dev" && !needsSetup && (
              <button className="admin-recovery" type="button" onClick={onForget} disabled={busy}>
                Forget the local passcode (development only)
              </button>
            )}
          </>
        )}

        <div style={{ marginTop: 22, fontSize: 13.5 }}>
          <Link to="/" style={{ color: "#8fb0cf" }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
