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
  maxWidth: "640px",
  maxHeight: "90dvh",
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
  paddingBottom: vars.space[3],
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
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
  selectors: { "&:hover": { color: vars.color.ink } },
});

// Scrollable crop stage with the same checkerboard as the region preview.
export const stage = style({
  flex: 1,
  overflow: "auto",
  marginInline: vars.space[6],
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.line}`,
  backgroundColor: vars.color.surfaceSunken,
  backgroundImage: `linear-gradient(45deg, ${vars.color.line} 25%, transparent 25%), linear-gradient(-45deg, ${vars.color.line} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${vars.color.line} 75%), linear-gradient(-45deg, transparent 75%, ${vars.color.line} 75%)`,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
  display: "grid",
  placeItems: "center",
  padding: vars.space[4],
});

export const image = style({
  display: "block",
  maxWidth: "100%",
  maxHeight: "56dvh",
});

export const foot = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  padding: vars.space[6],
  paddingTop: vars.space[4],
});

export const hint = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.inkSubtle,
  fontFamily: vars.font.mono,
});

export const footActions = style({
  display: "flex",
  gap: vars.space[2],
});
