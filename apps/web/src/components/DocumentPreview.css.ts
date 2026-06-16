import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const panel = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  maxHeight: "calc(100dvh - 6rem)",
  minHeight: "420px",
});

export const bar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  paddingInline: vars.space[4],
  paddingBlock: vars.space[3],
  borderBottom: `1px solid ${vars.color.line}`,
});

export const fileName = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkMuted,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const scroll = style({
  flex: 1,
  overflowY: "auto",
  backgroundColor: vars.color.surfaceSunken,
  padding: vars.space[5],
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[5],
});

export const pageWrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space[2],
  width: "100%",
});

export const pageImg = style({
  width: "100%",
  height: "auto",
  borderRadius: vars.radius.sm,
  border: `1px solid ${vars.color.line}`,
  boxShadow: vars.shadow.md,
  backgroundColor: vars.color.surface,
});

export const pageLabel = style({
  fontFamily: vars.font.mono,
  fontSize: "0.65rem",
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkSubtle,
});

export const loading = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[3],
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
  backgroundColor: vars.color.surfaceSunken,
});
