import { useEffect } from "react";
import { DEFAULT_THEME, getTheme, isValidTheme } from "./themes";

/** Applies `settings.theme` to <html data-theme> whenever it changes.
 * Unknown ids fall back to the default theme. */
export function useThemeApplier(themeId: string | undefined) {
  useEffect(() => {
    const id = themeId && isValidTheme(themeId) ? themeId : DEFAULT_THEME;
    document.documentElement.setAttribute("data-theme", id);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [themeId]);
}

export { getTheme, isValidTheme, DEFAULT_THEME };
export type { ThemeDef } from "./themes";
