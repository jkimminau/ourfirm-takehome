import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/* Themed base layer. The bare reset lives in app/globals.css; this adds the
   design-system typography and interaction defaults on top of the tokens. */

globalStyle("body", {
  backgroundColor: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.base,
  lineHeight: vars.lineHeight.normal,
  fontWeight: vars.fontWeight.regular,
  letterSpacing: vars.letterSpacing.normal,
});

globalStyle("h1, h2, h3, h4", {
  fontFamily: vars.font.display,
  fontWeight: vars.fontWeight.semibold,
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.tight,
  color: vars.color.ink,
});

globalStyle("::selection", {
  backgroundColor: vars.color.accentSoft,
  color: vars.color.accent,
});

globalStyle("button, input, textarea, select", {
  font: "inherit",
  color: "inherit",
});

/* A single, consistent keyboard-focus treatment everywhere. */
globalStyle(":focus-visible", {
  outline: "none",
  boxShadow: vars.shadow.focus,
  borderRadius: vars.radius.sm,
});

globalStyle("*", {
  transitionTimingFunction: vars.ease.standard,
});

/* Respect reduced-motion: neutralize transitions/animations globally. */
globalStyle("*", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transitionDuration: "0.01ms !important",
      animationDuration: "0.01ms !important",
    },
  },
});
