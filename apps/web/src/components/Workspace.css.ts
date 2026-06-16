import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const grid = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: vars.space[6],
  alignItems: "start",
  paddingTop: vars.space[8],
  paddingBottom: vars.space[16],
  "@media": {
    "screen and (max-width: 920px)": { gridTemplateColumns: "1fr" },
  },
});

export const previewCol = style({
  position: "sticky",
  top: vars.space[6],
  "@media": {
    "screen and (max-width: 920px)": { position: "static" },
  },
});

export const errorWrap = style({
  maxWidth: vars.size.narrow,
  marginInline: "auto",
  paddingTop: vars.space[12],
  paddingBottom: vars.space[20],
});

export const processing = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space[4],
  minHeight: "320px",
  padding: vars.space[8],
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  textAlign: "center",
});

export const processingTitle = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.lg,
});

export const processingHint = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.inkMuted,
  maxWidth: "32ch",
});
