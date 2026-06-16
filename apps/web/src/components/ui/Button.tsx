import { forwardRef, type ButtonHTMLAttributes } from "react";
import { css, cx } from "@linaria/core";

import { theme } from "@/styles/theme";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(base, variants[variant], sizes[size], className)}
        {...rest}
      />
    );
  },
);

const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  font-family: ${theme.font.body};
  font-weight: ${theme.fontWeight.medium};
  border-radius: ${theme.radius.md};
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  user-select: none;
  transition-property: background-color, border-color, color, box-shadow, transform;
  transition-duration: ${theme.duration.fast};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

const variants: Record<Variant, string> = {
  primary: css`
    background-color: ${theme.color.accent};
    color: ${theme.color.onAccent};
    &:hover:not(:disabled) {
      background-color: ${theme.color.accentHover};
    }
  `,
  secondary: css`
    background-color: ${theme.color.surface};
    color: ${theme.color.ink};
    border-color: ${theme.color.lineStrong};
    &:hover:not(:disabled) {
      border-color: ${theme.color.ink};
      background-color: ${theme.color.surfaceSunken};
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${theme.color.inkMuted};
    &:hover:not(:disabled) {
      color: ${theme.color.ink};
      background-color: ${theme.color.surfaceSunken};
    }
  `,
};

const sizes: Record<Size, string> = {
  sm: css`
    height: 34px;
    padding: 0 ${theme.space[3]};
    font-size: ${theme.fontSize.sm};
  `,
  md: css`
    height: 42px;
    padding: 0 ${theme.space[5]};
    font-size: ${theme.fontSize.sm};
  `,
  lg: css`
    height: 50px;
    padding: 0 ${theme.space[6]};
    font-size: ${theme.fontSize.base};
  `,
};
