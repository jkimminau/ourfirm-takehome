import type { HTMLAttributes } from "react";
import { css, cx } from "@linaria/core";

import { theme } from "@/styles/theme";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add hover elevation/lift (for clickable cards). */
  interactive?: boolean;
}

export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div className={cx(card, interactive && interactiveCard, className)} {...rest} />
  );
}

const card = css`
  background-color: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.lg};
  padding: ${theme.space[6]};
`;

const interactiveCard = css`
  transition-property: border-color, box-shadow, transform;
  transition-duration: ${theme.duration.base};

  &:hover {
    border-color: ${theme.color.lineStrong};
    box-shadow: ${theme.shadow.md};
    transform: translateY(-2px);
  }
`;
