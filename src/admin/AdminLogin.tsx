import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../data/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await signIn(passcode);
    setBusy(false);
    if (ok) {
      navigate("/admin", { replace: true });
    } else {
      setError("Incorrect passcode — try again.");
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
              placeholder="Enter admin passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          <button className="admin-btn primary" style={{ width: "100%", padding: 13 }} disabled={busy}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <div className="login-error">{error}</div>
        </form>
        <div className="login-hint">Default passcode: jagadamba2077 — change it in Settings.</div>
        <div style={{ marginTop: 22, fontSize: 13.5 }}>
          <Link to="/" style={{ color: "#8fb0cf" }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
