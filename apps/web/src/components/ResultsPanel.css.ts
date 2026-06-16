import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const head = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space[3],
  flexWrap: "wrap",
});

export const heading = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
});

export const summary = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});
