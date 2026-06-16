import { style } from "@vanilla-extract/css";
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

export const foot = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  padding: vars.space[4],
});

export const meta = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkSubtle,
});

export const confidenceDot = style({
  width: "7px",
  height: "7px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.positive,
});
