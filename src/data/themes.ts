// Site theme catalog. Each theme maps to a `data-theme` attribute on <html>
// and a matching CSS variable override block at the end of src/index.css.
//
// The first two lean on the Jagadamba logo colors (navy blue + red), the rest
// are original looks chosen for range: water-green, futuristic violet,
// industrial mono, heritage amber and bright ice.

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  /** Small preview dots: page background, highlight accent, CTA color. */
  swatch: { bg: string; accent: string; cta: string };
}

export const DEFAULT_THEME = "deep-ocean";

export const THEMES: ThemeDef[] = [
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Logo navy with cyan glow — the signature look.",
    swatch: { bg: "#04122b", accent: "#59d2e8", cta: "#e02129" },
  },
  {
    id: "brand-crimson",
    name: "Brand Crimson",
    description: "Logo red & gold, bold industrial energy.",
    swatch: { bg: "#190709", accent: "#f5c66d", cta: "#e02129" },
  },
  {
    id: "emerald-flow",
    name: "Emerald Flow",
    description: "Fresh water-green with a warm orange CTA.",
    swatch: { bg: "#04140e", accent: "#4de3a2", cta: "#ff7a3c" },
  },
  {
    id: "violet-nebula",
    name: "Violet Nebula",
    description: "Futuristic purple with a magenta pop.",
    swatch: { bg: "#0d0722", accent: "#b78cff", cta: "#ff4d8f" },
  },
  {
    id: "graphite-mono",
    name: "Graphite Mono",
    description: "Monochrome steel with the red logo accent.",
    swatch: { bg: "#0d0f11", accent: "#d9dee3", cta: "#e02129" },
  },
  {
    id: "amber-heritage",
    name: "Amber Heritage",
    description: "Warm heritage gold and terracotta.",
    swatch: { bg: "#191004", accent: "#ffc14d", cta: "#e0561f" },
  },
  {
    id: "glacier-ice",
    name: "Glacier Ice",
    description: "Bright icy blues — crisp and light.",
    swatch: { bg: "#10283c", accent: "#7fe4ff", cta: "#e02129" },
  },
  {
    id: "himalayan-dawn",
    name: "Himalayan Dawn",
    description: "Warm plum, copper and sunrise gold for a distinctive editorial feel.",
    swatch: { bg: "#211526", accent: "#f2b66d", cta: "#ef6b57" },
  },
  {
    id: "blueprint-grid",
    name: "Blueprint Grid",
    description: "Technical navy with electric blue lines and a safety-orange accent.",
    swatch: { bg: "#071a33", accent: "#63b3ff", cta: "#ff8a3d" },
  },
  {
    id: "terracotta-workshop",
    name: "Terracotta Workshop",
    description: "Earthy charcoal, clay and saffron for a grounded industrial character.",
    swatch: { bg: "#21150f", accent: "#f0a35b", cta: "#d85d3f" },
  },
];

export function isValidTheme(id: unknown): id is string {
  return typeof id === "string" && THEMES.some((t) => t.id === id);
}

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
