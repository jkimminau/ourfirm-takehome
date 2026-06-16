import { style } from "@vanilla-extract/css";

export const main = style({
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
  padding: "2rem",
  textAlign: "center",
});

export const title = style({
  fontSize: "1.75rem",
  fontWeight: 600,
  letterSpacing: "-0.02em",
});

export const subtitle = style({
  color: "#6b7280",
  maxWidth: "32rem",
  lineHeight: 1.6,
});

export const badge = style({
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "#374151",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "0.25rem 0.75rem",
});
