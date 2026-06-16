"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/cx";
import { CopyIcon, CheckIcon } from "./ui/icons";
import * as s from "./CopyButton.css";

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
      className={cx(s.button, copied && s.copied)}
      onClick={copy}
      aria-label="Copy text"
    >
      {copied ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
