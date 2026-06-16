import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const card = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  overflow: "hidden",
});

export const head = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: vars.space[4],
  paddingBottom: vars.space[3],
});

export const name = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.semibold,
});

// Checkerboard so PNG transparency reads clearly behind the crop.
export const previewWell = style({
  position: "relative",
  marginInline: vars.space[4],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.line}`,
  minHeight: "120px",
  display: "grid",
  placeItems: "center",
  padding: vars.space[3],
  overflow: "hidden",
  backgroundColor: vars.color.surfaceSunken,
  backgroundImage: `linear-gradient(45deg, ${vars.color.line} 25%, transparent 25%), linear-gradient(-45deg, ${vars.color.line} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${vars.color.line} 75%), linear-gradient(-45deg, transparent 75%, ${vars.color.line} 75%)`,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
});

export const previewImg = style({
  maxWidth: "100%",
  maxHeight: "220px",
  objectFit: "contain",
  borderRadius: vars.radius.sm,
  boxShadow: vars.shadow.sm,
});

export const missing = style({
  marginInline: vars.space[4],
  borderRadius: vars.radius.md,
  border: `1px dashed ${vars.color.lineStrong}`,
  minHeight: "120px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  padding: vars.space[5],
  textAlign: "center",
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
  lineHeight: vars.lineHeight.normal,
});

/* ---- collapsible text content ---------------------------------------- */
export const details = style({
  marginInline: vars.space[4],
  marginTop: vars.space[4],
  borderTop: `1px solid ${vars.color.line}`,
});

export const summary = style({
  listStyle: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  paddingBlock: vars.space[3],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkMuted,
  selectors: {
    "&::-webkit-details-marker": { display: "none" },
    "&:hover": { color: vars.color.ink },
  },
});

export const chevron = style({
  transition: `transform ${vars.duration.fast}`,
  selectors: { "details[open] &": { transform: "rotate(90deg)" } },
});

export const textBox = style({
  marginBottom: vars.space[4],
  maxHeight: "180px",
  overflowY: "auto",
  padding: vars.space[3],
  backgroundColor: vars.color.surfaceSunken,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  lineHeight: vars.lineHeight.relaxed,
  color: vars.color.ink,
  whiteSpace: "pre-wrap",
  userSelect: "text",
});

export const emptyText = style({
  marginBottom: vars.space[4],
  fontSize: vars.fontSize.sm,
  color: vars.color.inkSubtle,
  fontStyle: "italic",
});

export const copyRow = style({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: vars.space[2],
});

/* ---- footer: confidence + downloads ---------------------------------- */
export const foot = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  padding: vars.space[4],
});

export const confidence = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
});

export const dot = style({
  width: "7px",
  height: "7px",
  borderRadius: vars.radius.full,
  flexShrink: 0,
});

export const tierDot = styleVariants({
  high: { backgroundColor: vars.color.positive },
  moderate: { backgroundColor: vars.color.warning },
  low: { backgroundColor: vars.color.danger },
});

export const tierText = styleVariants({
  high: { color: vars.color.inkMuted },
  moderate: { color: vars.color.warning },
  low: { color: vars.color.danger },
});

export const actions = style({
  display: "flex",
  gap: vars.space[2],
  flexShrink: 0,
});

export const iconBtn = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.onAccent,
  backgroundColor: vars.color.accent,
  border: "1px solid transparent",
  borderRadius: vars.radius.md,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  cursor: "pointer",
  transitionProperty: "background-color, transform",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:hover:not(:disabled)": { backgroundColor: vars.color.accentHover },
    "&:active:not(:disabled)": { transform: "translateY(1px)" },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

// Second format gets a quieter, outline treatment to reduce visual weight.
export const iconBtnAlt = style({
  color: vars.color.ink,
  backgroundColor: vars.color.surface,
  borderColor: vars.color.lineStrong,
  selectors: {
    "&:hover": {
      backgroundColor: vars.color.surfaceSunken,
      borderColor: vars.color.ink,
    },
  },
});
