import type { HTMLAttributes } from "react";
import { css, cx } from "@linaria/core";

import { theme } from "@/styles/theme";

type Tone = keyof typeof tone;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Small uppercase mono label — region names, format pills, status tags. */
export function Badge({ tone: toneProp = "neutral", className, ...rest }: BadgeProps) {
  return <span className={cx(base, tone[toneProp], className)} {...rest} />;
}

const base = css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wider};
  line-height: 1;
  padding: ${theme.space[1]} ${theme.space[2]};
  border-radius: ${theme.radius.sm};
  border: 1px solid transparent;
`;

const tone = {
  neutral: css`
    background-color: ${theme.color.surfaceSunken};
    color: ${theme.color.inkMuted};
  `,
  accent: css`
    background-color: ${theme.color.accentSoft};
    color: ${theme.color.accent};
  `,
  positive: css`
    background-color: ${theme.color.positiveSoft};
    color: ${theme.color.positive};
  `,
  danger: css`
    background-color: ${theme.color.dangerSoft};
    color: ${theme.color.danger};
  `,
  outline: css`
    border-color: ${theme.color.line};
    color: ${theme.color.inkMuted};
  `,
};
