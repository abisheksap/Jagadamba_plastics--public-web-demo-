import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ensurePasscodeSeeded, isAdmin } from "../data/adminAuth";
import AdminLogin from "./AdminLogin";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    ensurePasscodeSeeded().then(() => {
      setAuthed(isAdmin());
      setChecked(true);
    });
  }, []);

  if (!checked) return null;
  if (!authed) return <AdminLogin />;
  return <>{children}</>;
}
