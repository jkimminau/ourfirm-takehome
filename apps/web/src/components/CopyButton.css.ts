import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const button = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontFamily: vars.font.mono,
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkMuted,
  background: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.sm,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  cursor: "pointer",
  transitionProperty: "color, border-color, background-color",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:hover": { color: vars.color.ink, borderColor: vars.color.lineStrong },
  },
});

export const copied = style({
  color: vars.color.positive,
  borderColor: vars.color.positive,
});
