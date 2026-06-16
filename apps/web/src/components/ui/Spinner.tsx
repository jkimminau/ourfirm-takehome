import { css } from "@linaria/core";

import { theme } from "@/styles/theme";

export function Spinner() {
  return <span className={spinner} role="status" aria-label="Loading" />;
}

const spinner = css`
  @keyframes spinnerSpin {
    to {
      transform: rotate(360deg);
    }
  }
  width: 22px;
  height: 22px;
  border-radius: ${theme.radius.full};
  border: 2px solid ${theme.color.line};
  border-top-color: ${theme.color.accent};
  animation: spinnerSpin 0.7s linear infinite;
`;
