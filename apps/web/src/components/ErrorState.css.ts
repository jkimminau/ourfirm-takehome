import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: vars.space[4],
  padding: vars.space[8],
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.dangerSoft}`,
  borderRadius: vars.radius.lg,
  height: "100%",
  justifyContent: "center",
});

export const icon = style({
  width: "40px",
  height: "40px",
  borderRadius: vars.radius.full,
  display: "grid",
  placeItems: "center",
  backgroundColor: vars.color.dangerSoft,
  color: vars.color.danger,
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
});

export const message = style({
  color: vars.color.inkMuted,
  lineHeight: vars.lineHeight.relaxed,
  maxWidth: "46ch",
});

export const detail = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  color: vars.color.inkSubtle,
  backgroundColor: vars.color.surfaceSunken,
  padding: `${vars.space[2]} ${vars.space[3]}`,
  borderRadius: vars.radius.sm,
});
