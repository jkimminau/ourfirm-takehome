/**
 * Design tokens as CSS-variable references. The actual values live in
 * app/globals.css (`:root`). Linaria inlines these `var(--…)` strings into the
 * `css` templates at build time (zero runtime), and theming stays in one place.
 *
 * Direction: "refined editorial correspondence" — warm paper, terracotta
 * wax-seal accent, Fraunces serif + Hanken Grotesk + Geist Mono. Light mode.
 */
export const theme = {
  color: {
    paper: "var(--color-paper)",
    surface: "var(--color-surface)",
    surfaceSunken: "var(--color-surface-sunken)",
    ink: "var(--color-ink)",
    inkMuted: "var(--color-ink-muted)",
    inkSubtle: "var(--color-ink-subtle)",
    line: "var(--color-line)",
    lineStrong: "var(--color-line-strong)",
    accent: "var(--color-accent)",
    accentHover: "var(--color-accent-hover)",
    accentSoft: "var(--color-accent-soft)",
    onAccent: "var(--color-on-accent)",
    positive: "var(--color-positive)",
    positiveSoft: "var(--color-positive-soft)",
    warning: "var(--color-warning)",
    warningSoft: "var(--color-warning-soft)",
    danger: "var(--color-danger)",
    dangerSoft: "var(--color-danger-soft)",
    focus: "var(--color-focus)",
  },
  font: {
    display: "var(--font-display), Georgia, serif",
    body: "var(--font-body), system-ui, sans-serif",
    mono: "var(--font-mono), ui-monospace, monospace",
  },
  fontSize: {
    xs: "var(--fs-xs)",
    sm: "var(--fs-sm)",
    base: "var(--fs-base)",
    lg: "var(--fs-lg)",
    xl: "var(--fs-xl)",
    "2xl": "var(--fs-2xl)",
    "3xl": "var(--fs-3xl)",
    "4xl": "var(--fs-4xl)",
    "5xl": "var(--fs-5xl)",
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
    wider: "0.14em",
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
    content: "1120px",
    narrow: "720px",
    gutter: "clamp(1.25rem, 5vw, 4rem)",
  },
} as const;
