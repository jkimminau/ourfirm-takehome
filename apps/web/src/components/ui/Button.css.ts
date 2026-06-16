import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

export const base = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[2],
  fontFamily: vars.font.body,
  fontWeight: vars.fontWeight.medium,
  borderRadius: vars.radius.md,
  border: "1px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
  textDecoration: "none",
  userSelect: "none",
  transitionProperty: "background-color, border-color, color, box-shadow, transform",
  transitionDuration: vars.duration.fast,
  selectors: {
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      pointerEvents: "none",
    },
    "&:active:not(:disabled)": {
      transform: "translateY(1px)",
    },
  },
});

export const variant = styleVariants({
  primary: {
    backgroundColor: vars.color.accent,
    color: vars.color.onAccent,
    selectors: {
      "&:hover:not(:disabled)": { backgroundColor: vars.color.accentHover },
    },
  },
  secondary: {
    backgroundColor: vars.color.surface,
    color: vars.color.ink,
    borderColor: vars.color.lineStrong,
    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: vars.color.ink,
        backgroundColor: vars.color.surfaceSunken,
      },
    },
  },
  ghost: {
    backgroundColor: "transparent",
    color: vars.color.inkMuted,
    selectors: {
      "&:hover:not(:disabled)": {
        color: vars.color.ink,
        backgroundColor: vars.color.surfaceSunken,
      },
    },
  },
});

export const size = styleVariants({
  sm: { height: "34px", padding: `0 ${vars.space[3]}`, fontSize: vars.fontSize.sm },
  md: { height: "42px", padding: `0 ${vars.space[5]}`, fontSize: vars.fontSize.sm },
  lg: { height: "50px", padding: `0 ${vars.space[6]}`, fontSize: vars.fontSize.base },
});
