import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const group = style({
  display: "inline-flex",
  padding: "3px",
  gap: "2px",
  backgroundColor: vars.color.surfaceSunken,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.line}`,
});

export const option = style({
  appearance: "none",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkMuted,
  padding: `${vars.space[1]} ${vars.space[3]}`,
  borderRadius: vars.radius.sm,
  transitionProperty: "background-color, color",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:hover:not([data-active='true'])": { color: vars.color.ink },
  },
});

export const optionActive = style({
  backgroundColor: vars.color.surface,
  color: vars.color.ink,
  boxShadow: vars.shadow.sm,
});
