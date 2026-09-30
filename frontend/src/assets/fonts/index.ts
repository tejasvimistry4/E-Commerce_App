import "./fonts.css";

export const FONTS = {
  SANS: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  HEADING: '"Outfit", "Inter", sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export type FontFamily = keyof typeof FONTS;
