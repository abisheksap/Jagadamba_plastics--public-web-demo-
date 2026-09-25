import { useEffect } from "react";
import { DEFAULT_THEME, getTheme, isValidTheme } from "./themes";

const PUBLIC_THEME_KEY = "jagadamba-public-theme";
export const PUBLIC_THEME_EVENT = "jagadamba-public-theme-change";

function readPublicTheme(): string | null {
  try {
    const value = window.localStorage.getItem(PUBLIC_THEME_KEY);
    return value && isValidTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function setPublicThemePreference(theme: string) {
  const id = isValidTheme(theme) ? theme : DEFAULT_THEME;
  try {
    window.localStorage.setItem(PUBLIC_THEME_KEY, id);
  } catch {
    // Private browsing can disable storage; the in-memory update still works.
  }
  document.documentElement.setAttribute("data-theme", id);
  window.dispatchEvent(new CustomEvent(PUBLIC_THEME_EVENT, { detail: { theme: id } }));
}

export function getPublicThemePreference(): string | null {
  return readPublicTheme();
}

/** Applies the public preference first, then the CMS theme when no visitor override exists. */
export function useThemeApplier(themeId: string | undefined) {
  useEffect(() => {
    const applyTheme = (event?: Event) => {
      const eventTheme = (event as CustomEvent<{ theme?: string }> | undefined)?.detail?.theme;
      const preferred = eventTheme ?? readPublicTheme();
      const id = preferred && isValidTheme(preferred)
        ? preferred
        : themeId && isValidTheme(themeId)
          ? themeId
          : DEFAULT_THEME;
      document.documentElement.setAttribute("data-theme", id);
    };
    applyTheme();
    window.addEventListener(PUBLIC_THEME_EVENT, applyTheme);
    return () => {
      window.removeEventListener(PUBLIC_THEME_EVENT, applyTheme);
      document.documentElement.removeAttribute("data-theme");
    };
  }, [themeId]);
}

export { getTheme, isValidTheme, DEFAULT_THEME };
export type { ThemeDef } from "./themes";
