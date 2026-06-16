import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

export const base = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[1],
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wider,
  lineHeight: 1,
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radius.sm,
  border: "1px solid transparent",
});

export const tone = styleVariants({
  neutral: {
    backgroundColor: vars.color.surfaceSunken,
    color: vars.color.inkMuted,
  },
  accent: {
    backgroundColor: vars.color.accentSoft,
    color: vars.color.accent,
  },
  positive: {
    backgroundColor: vars.color.positiveSoft,
    color: vars.color.positive,
  },
  danger: {
    backgroundColor: vars.color.dangerSoft,
    color: vars.color.danger,
  },
  outline: {
    borderColor: vars.color.line,
    color: vars.color.inkMuted,
  },
});
