import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

const spin = keyframes({
  to: { transform: "rotate(360deg)" },
});

export const spinner = style({
  width: "22px",
  height: "22px",
  borderRadius: vars.radius.full,
  border: `2px solid ${vars.color.line}`,
  borderTopColor: vars.color.accent,
  animation: `${spin} 0.7s linear infinite`,
});
