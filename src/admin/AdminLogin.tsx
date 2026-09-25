import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetLocalPasscode, signIn } from "../data/adminAuth";
import { convexEnabled } from "../data/convexClient";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const ok = await signIn(passcode);
      if (ok) {
        navigate("/admin", { replace: true });
      } else {
        setError("Incorrect passcode — try again.");
      }
    } catch {
      setError("The admin gate could not start in this browser. Try a normal HTTPS tab or reset local access below.");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setBusy(true);
    setError("");
    setRecoveryMsg("");
    try {
      await resetLocalPasscode();
      setRecoveryMsg("Local access reset. Sign in with jagadamba2077.");
    } catch {
      setError("Could not reset local access in this browser.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <img src="/images/logo.png" alt="" />
          Jagadamba Admin
        </div>
        <div className="sub">Content panel for products, gallery, reviews and enquiries.</div>
        <form onSubmit={onSubmit}>
          <div className="admin-field">
            <label htmlFor="passcode">PASSCODE</label>
            <input
              id="passcode"
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="Enter admin passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn primary" style={{ width: "100%", padding: 13 }} disabled={busy}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <div className="login-error">{error || recoveryMsg}</div>
        </form>
        <div className="login-hint">Default passcode: jagadamba2077 — change it in Settings.</div>
        {!convexEnabled && (
          <button className="admin-recovery" type="button" onClick={onReset} disabled={busy}>
            Reset local admin access
          </button>
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
