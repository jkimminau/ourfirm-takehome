import { createGlobalTheme } from "@vanilla-extract/css";

/**
 * Design system — "refined editorial correspondence."
 *
 * The app extracts letterheads, signatures, and footers, so the visual language
 * leans into paper-and-ink: a warm paper canvas, warm near-black ink, and a
 * single terracotta accent (the color of a wax seal / ink stamp) used sparingly.
 * Light mode only. Font CSS variables are supplied by next/font in layout.tsx.
 */
export const vars = createGlobalTheme(":root", {
  color: {
    // surfaces
    paper: "#F6F5F0", // page canvas (warm off-white)
    surface: "#FFFFFF", // cards / elevated panels
    surfaceSunken: "#EFEDE4", // wells, preview backdrops
    // ink
    ink: "#1C1B17", // primary text (warm near-black)
    inkMuted: "#6B6A60", // secondary text
    inkSubtle: "#9C9A8C", // tertiary text, placeholders
    // lines
    line: "#E6E3D9", // hairline borders
    lineStrong: "#D6D3C5", // emphasized borders, dividers
    // accent — wax seal / ink stamp
    accent: "#C75B39",
    accentHover: "#B14E30",
    accentSoft: "#F5E5DD", // tinted accent surface
    onAccent: "#FCF8F4", // text/icons on accent
    // semantic (kept muted to stay in palette)
    positive: "#5C7A5A", // high confidence / detected
    positiveSoft: "#E7EDE3",
    warning: "#A8761E", // moderate confidence — warm ochre
    warningSoft: "#F3E9D6",
    danger: "#A3342B", // low confidence / hard errors
    dangerSoft: "#F4E2DF",
    // focus ring color
    focus: "#C75B39",
  },

  font: {
    display: "var(--font-display), Georgia, serif",
    body: "var(--font-body), system-ui, sans-serif",
    mono: "var(--font-mono), ui-monospace, monospace",
  },

  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.25rem",
    "4xl": "3rem",
    "5xl": "4rem",
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: "1.1",
    snug: "1.3",
    normal: "1.5",
    relaxed: "1.7",
  },

  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.04em",
    wider: "0.14em", // small-caps style labels
  },

  space: {
    px: "1px",
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem",
    "32": "8rem",
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    full: "999px",
  },

  shadow: {
    sm: "0 1px 2px rgba(28, 27, 23, 0.05)",
    md: "0 4px 16px -4px rgba(28, 27, 23, 0.10)",
    lg: "0 12px 32px -8px rgba(28, 27, 23, 0.14)",
    focus: "0 0 0 3px rgba(199, 91, 57, 0.28)",
  },

  duration: {
    fast: "120ms",
    base: "200ms",
    slow: "360ms",
  },

  ease: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
  },

  size: {
    content: "1120px", // main column max-width
    narrow: "720px", // reading / single-column max-width
    gutter: "clamp(1.25rem, 5vw, 4rem)", // page content margins
  },
});
