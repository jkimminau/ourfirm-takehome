import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const backdrop = style({
  position: "fixed",
  inset: 0,
  zIndex: 50,
  backgroundColor: "rgba(28, 27, 23, 0.45)",
  backdropFilter: "blur(2px)",
  display: "grid",
  placeItems: "center",
  padding: vars.space[5],
});

export const panel = style({
  width: "100%",
  maxWidth: "560px",
  maxHeight: "85dvh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.paper,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.lg,
  overflow: "hidden",
});

export const head = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: vars.space[4],
  padding: vars.space[6],
  paddingBottom: vars.space[4],
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize["2xl"],
  margin: 0,
});

export const subtitle = style({
  marginTop: vars.space[1],
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
});

export const close = style({
  flexShrink: 0,
  width: "34px",
  height: "34px",
  display: "grid",
  placeItems: "center",
  borderRadius: vars.radius.full,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface,
  color: vars.color.inkMuted,
  cursor: "pointer",
  transitionProperty: "color, border-color, background-color",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:hover": { color: vars.color.ink, borderColor: vars.color.lineStrong },
  },
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[3],
  padding: vars.space[6],
  paddingTop: vars.space[2],
  overflowY: "auto",
});

export const groupLabel = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wider,
  color: vars.color.inkSubtle,
  marginTop: vars.space[2],
});

export const item = style({
  display: "block",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  background: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  padding: vars.space[4],
  transitionProperty: "border-color, box-shadow, transform",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
      boxShadow: vars.shadow.sm,
      transform: "translateY(-1px)",
    },
  },
});

export const itemHead = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  marginBottom: vars.space[2],
});

export const itemName = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.semibold,
});

export const itemDesc = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
  lineHeight: vars.lineHeight.normal,
});
