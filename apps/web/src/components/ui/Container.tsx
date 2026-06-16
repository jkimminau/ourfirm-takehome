import type { ElementType, ReactNode } from "react";
import { css, cx } from "@linaria/core";

import { theme } from "@/styles/theme";

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
    <Tag className={cx(container, narrow && narrowWidth, className)}>
      {children}
    </Tag>
  );
}

const container = css`
  width: 100%;
  max-width: ${theme.size.content};
  margin-inline: auto;
  padding-inline: ${theme.size.gutter};
`;

const narrowWidth = css`
  max-width: ${theme.size.narrow};
`;
