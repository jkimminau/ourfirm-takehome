import type { ElementType, ReactNode } from "react";
import { cx } from "../../lib/cx";
import * as styles from "./Container.css";

interface ContainerProps {
  as?: ElementType;
  /** Constrain to the narrower reading width. */
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}

/** Centers content and applies the shared page gutters (content margins). */
export function Container({
  as: Tag = "div",
  narrow,
  className,
  children,
}: ContainerProps) {
  return (
    <Tag className={cx(styles.container, narrow && styles.narrow, className)}>
      {children}
    </Tag>
  );
}
