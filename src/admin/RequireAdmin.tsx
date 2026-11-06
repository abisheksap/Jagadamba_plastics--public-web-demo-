import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isAdmin, sessionExpiresAt, signOut, subscribeToAdminAuth } from "../data/adminAuth";
import { AdminDataProvider } from "../data/SiteDataProvider";
import AdminLogin from "./AdminLogin";

/** Gate for every /admin page: shows the login form until there is a live session. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(isAdmin);

  useEffect(() => subscribeToAdminAuth(() => setAuthed(isAdmin())), []);

  // the admin area must never be indexed, even if a link to it leaks
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  // when the session runs out, drop back to the login form
  useEffect(() => {
    if (!authed) return;
    const left = sessionExpiresAt() - Date.now();
    const timer = window.setTimeout(() => signOut(), Math.max(0, Math.min(left, 2 ** 31 - 1)));
    return () => window.clearTimeout(timer);
  }, [authed]);

  if (!authed) return <AdminLogin />;
  return <AdminDataProvider>{children}</AdminDataProvider>;
}
