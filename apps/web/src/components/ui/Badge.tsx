import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import * as styles from "./Badge.css";

type Tone = keyof typeof styles.tone;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Small uppercase mono label — region names, format pills, status tags. */
export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.base, styles.tone[tone], className)} {...rest} />
  );
}
