"use client";

import { Button } from "./ui/Button";
import * as s from "./ErrorState.css";

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
    <div className={s.wrap}>
      <span className={s.icon} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.3 1.7 18a2 2 0 0 0 1.7 3h17.2a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h2 className={s.title}>{title}</h2>
      <p className={s.message}>{message}</p>
      {detail && <code className={s.detail}>{detail}</code>}
      <Button variant="secondary" onClick={onRetry}>
        Try another document
      </Button>
    </div>
  );
}
