import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ensurePasscodeSeeded, isAdmin, subscribeToAdminAuth } from "../data/adminAuth";
import AdminLogin from "./AdminLogin";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    ensurePasscodeSeeded()
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setAuthed(isAdmin());
        setChecked(true);
      });
    const unsubscribe = subscribeToAdminAuth(() => {
      if (active) setAuthed(isAdmin());
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!checked) {
    return (
      <div className="admin-loading" role="status">
        <span className="admin-loading-mark" />
        <span>Opening the Jagadamba admin panel…</span>
      </div>
    );
  }
  if (!authed) return <AdminLogin />;
  return <>{children}</>;
}
