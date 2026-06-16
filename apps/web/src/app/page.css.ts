import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const page = style({
  display: "flex",
  flexDirection: "column",
  minHeight: "100dvh",
});

/* ---- Header ---------------------------------------------------------- */
export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBlock: vars.space[5],
});

export const brand = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space[3],
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.lg,
  fontWeight: vars.fontWeight.semibold,
});

export const seal = style({
  width: "11px",
  height: "11px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.accent,
  boxShadow: `0 0 0 4px ${vars.color.accentSoft}`,
});

export const headerNav = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[2],
});

/* ---- Hero ------------------------------------------------------------ */
export const hero = style({
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: vars.space[16],
  alignItems: "center",
  paddingTop: vars.space[16],
  paddingBottom: vars.space[20],
  "@media": {
    "screen and (max-width: 920px)": {
      gridTemplateColumns: "1fr",
      gap: vars.space[12],
      paddingTop: vars.space[10],
    },
  },
});

export const eyebrow = style({ marginBottom: vars.space[5] });

export const title = style({
  fontSize: "clamp(2.5rem, 6vw, 4rem)",
  lineHeight: vars.lineHeight.tight,
  letterSpacing: vars.letterSpacing.tight,
  margin: 0,
});

export const titleAccent = style({
  fontStyle: "italic",
  color: vars.color.accent,
});

export const lede = style({
  marginTop: vars.space[6],
  fontSize: vars.fontSize.lg,
  lineHeight: vars.lineHeight.relaxed,
  color: vars.color.inkMuted,
  maxWidth: "52ch",
});

export const actions = style({
  marginTop: vars.space[8],
  display: "flex",
  gap: vars.space[3],
  flexWrap: "wrap",
});

/* ---- Document mockup (decorative) ------------------------------------ */
export const mockupFrame = style({
  position: "relative",
  justifySelf: "center",
});

export const sheet = style({
  width: "min(360px, 100%)",
  aspectRatio: "1 / 1.32",
  backgroundColor: vars.color.surface,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.line}`,
  boxShadow: vars.shadow.lg,
  padding: vars.space[6],
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
  transform: "rotate(-1.5deg)",
});

export const zone = style({
  position: "relative",
  borderRadius: vars.radius.sm,
  padding: vars.space[3],
});

export const zoneLetterhead = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space[3],
  border: `1px solid ${vars.color.line}`,
});

export const zoneBody = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: vars.space[2],
  paddingBlock: vars.space[2],
});

export const zoneSignature = style({
  border: `1.5px solid ${vars.color.accent}`,
  backgroundColor: vars.color.accentSoft,
  minHeight: "72px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const zoneFooter = style({
  borderTop: `1px solid ${vars.color.line}`,
  paddingTop: vars.space[3],
  display: "flex",
  justifyContent: "space-between",
});

export const tag = style({
  position: "absolute",
  top: vars.space[2],
  right: vars.space[2],
  fontFamily: vars.font.mono,
  fontSize: "0.6rem",
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
  color: vars.color.inkSubtle,
});

export const tagAccent = style({ color: vars.color.accent });

export const line = style({
  height: "7px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.surfaceSunken,
});

export const sealMark = style({
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.full,
  backgroundColor: vars.color.accent,
  flexShrink: 0,
});

const drawSignature = keyframes({
  "0%": { strokeDashoffset: 240 },
  "100%": { strokeDashoffset: 0 },
});

export const signaturePath = style({
  fill: "none",
  stroke: vars.color.accent,
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeDasharray: 240,
  animation: `${drawSignature} 2.4s ${vars.ease.emphasized} 0.6s both`,
});

/* ---- Region cards ---------------------------------------------------- */
export const regions = style({
  paddingBottom: vars.space[24],
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: vars.space[5],
  "@media": {
    "screen and (max-width: 860px)": { gridTemplateColumns: "1fr" },
  },
});

export const regionCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space[4],
});

export const regionHead = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const regionName = style({
  fontFamily: vars.font.display,
  fontSize: vars.fontSize.xl,
  margin: 0,
});

export const regionDesc = style({
  color: vars.color.inkMuted,
  fontSize: vars.fontSize.sm,
  lineHeight: vars.lineHeight.normal,
  margin: 0,
});

/* ---- Footer ---------------------------------------------------------- */
export const footer = style({
  marginTop: "auto",
  borderTop: `1px solid ${vars.color.line}`,
  paddingBlock: vars.space[6],
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: vars.space[3],
  color: vars.color.inkSubtle,
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
});
