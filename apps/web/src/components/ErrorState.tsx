"use client";

import { css } from "@linaria/core";

import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";

interface ErrorStateProps {
  title?: string;
  message: string;
  detail?: string;
  onRetry: () => void;
}

export function ErrorState({
  title = "Couldn't extract this document",
  message,
  detail,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={wrap}>
      <span className={icon} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.3 1.7 18a2 2 0 0 0 1.7 3h17.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h2 className={title_}>{title}</h2>
      <p className={message_}>{message}</p>
      {detail && <code className={detail_}>{detail}</code>}
      <Button variant="secondary" onClick={onRetry}>
        Try another document
      </Button>
    </div>
  );
}

const wrap = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${theme.space[4]};
  padding: ${theme.space[8]};
  background-color: ${theme.color.surface};
  border: 1px solid ${theme.color.dangerSoft};
  border-radius: ${theme.radius.lg};
  height: 100%;
  justify-content: center;
`;

const icon = css`
  width: 40px;
  height: 40px;
  border-radius: ${theme.radius.full};
  display: grid;
  place-items: center;
  background-color: ${theme.color.dangerSoft};
  color: ${theme.color.danger};
`;

const title_ = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.xl};
`;

const message_ = css`
  color: ${theme.color.inkMuted};
  line-height: ${theme.lineHeight.relaxed};
  max-width: 46ch;
`;

const detail_ = css`
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  color: ${theme.color.inkSubtle};
  background-color: ${theme.color.surfaceSunken};
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: ${theme.radius.sm};
`;
