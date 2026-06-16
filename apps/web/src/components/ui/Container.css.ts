import { style } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

export const container = style({
  width: "100%",
  maxWidth: vars.size.content,
  marginInline: "auto",
  paddingInline: vars.size.gutter,
});

export const narrow = style({
  maxWidth: vars.size.narrow,
});
