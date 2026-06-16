"use client";

import { useEffect, useRef, useState } from "react";
import { css, cx } from "@linaria/core";

import { CopyIcon, CheckIcon } from "@/components/ui/icons";
import { theme } from "@/styles/theme";

interface CopyButtonProps {
  /** Text to copy. Users can also select a subset manually; this copies all. */
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — selection still works */
    }
  }

  return (
    <button
      type="button"
      className={cx(button, copied && copiedStyle)}
      onClick={copy}
      aria-label="Copy text"
    >
      {copied ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const button = css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.mono};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkMuted};
  background: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[1]} ${theme.space[2]};
  cursor: pointer;
  transition-property: color, border-color, background-color;
  transition-duration: ${theme.duration.fast};

  &:hover {
    color: ${theme.color.ink};
    border-color: ${theme.color.lineStrong};
  }
`;

const copiedStyle = css`
  color: ${theme.color.positive};
  border-color: ${theme.color.positive};
`;
