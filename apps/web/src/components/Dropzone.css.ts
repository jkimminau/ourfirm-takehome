import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const zone = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[3],
  textAlign: "center",
  padding: `${vars.space[8]} ${vars.space[8]}`,
  backgroundColor: vars.color.surface,
  border: `2px dashed ${vars.color.lineStrong}`,
  borderRadius: vars.radius.xl,
  cursor: "pointer",
  transitionProperty: "border-color, background-color, transform",
  transitionDuration: vars.duration.base,
  selectors: {
    "&:hover": { borderColor: vars.color.inkSubtle, backgroundColor: vars.color.paper },
  },
});

export const dragActive = style({
  borderColor: vars.color.accent,
  backgroundColor: vars.color.accentSoft,
  transform: "scale(1.005)",
});

export const rejected = style({
  borderColor: vars.color.danger,
  backgroundColor: vars.color.dangerSoft,
});

export const seal = style({
  width: "48px",
  height: "48px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.accentSoft,
  color: vars.color.accent,
  display: "grid",
  placeItems: "center",
});

export const title = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
  color: vars.color.ink,
});

export const accentText = style({ color: vars.color.accent });

export const hint = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
});

export const note = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkSubtle,
});
