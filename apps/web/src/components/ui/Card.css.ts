import { style } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

export const card = style({
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  padding: vars.space[6],
});

export const interactive = style({
  transitionProperty: "border-color, box-shadow, transform",
  transitionDuration: vars.duration.base,
  selectors: {
    "&:hover": {
      borderColor: vars.color.lineStrong,
      boxShadow: vars.shadow.md,
      transform: "translateY(-2px)",
    },
  },
});
