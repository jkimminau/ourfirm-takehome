import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import * as styles from "./Card.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add hover elevation/lift (for clickable cards). */
  interactive?: boolean;
}

export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(styles.card, interactive && styles.interactive, className)}
      {...rest}
    />
  );
}
