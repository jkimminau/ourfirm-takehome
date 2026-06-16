import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import * as styles from "./Button.css";

type Variant = keyof typeof styles.variant;
type Size = keyof typeof styles.size;

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
        className={cx(styles.base, styles.variant[variant], styles.size[size], className)}
        {...rest}
      />
    );
  },
);
