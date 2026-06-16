"use client";

import { IMAGE_FORMATS, type ImageFormat } from "@ourfirm/shared";
import { cx } from "../lib/cx";
import * as s from "./FormatToggle.css";

interface FormatToggleProps {
  value: ImageFormat;
  onChange: (format: ImageFormat) => void;
}

/** Segmented control selecting the download format for all regions. */
export function FormatToggle({ value, onChange }: FormatToggleProps) {
  return (
    <div className={s.group} role="radiogroup" aria-label="Download format">
      {IMAGE_FORMATS.map((format) => {
        const active = format === value;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active}
            className={cx(s.option, active && s.optionActive)}
            onClick={() => onChange(format)}
          >
            {format}
          </button>
        );
      })}
    </div>
  );
}
