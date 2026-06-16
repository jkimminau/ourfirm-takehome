"use client";

import { useEffect, useRef, useState } from "react";
import { css } from "@linaria/core";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type {
  DetectedRegion,
  PagePreview,
  RegionImages,
} from "@ourfirm/shared";

import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";

const LABELS: Record<DetectedRegion["kind"], string> = {
  letterhead: "letterhead",
  signature: "signature",
  footer: "footer",
};

interface CropEditorProps {
  region: DetectedRegion;
  /** The page the region was found on. */
  page: PagePreview;
  onApply: (images: RegionImages) => void;
  onClose: () => void;
}

/** Box (page-pixel space) → a percentage crop, resolution-independent. */
function boxToPercentCrop(region: DetectedRegion): Crop {
  const { box, page } = region;
  return {
    unit: "%",
    x: (box.x / page.width) * 100,
    y: (box.y / page.height) * 100,
    width: (box.width / page.width) * 100,
    height: (box.height / page.height) * 100,
  };
}

export function CropEditor({ region, page, onApply, onClose }: CropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const initial = boxToPercentCrop(region);
  const [crop, setCrop] = useState<Crop>(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function apply() {
    const img = imgRef.current;
    if (!img || !crop.width || !crop.height) return;

    const sx = (crop.x / 100) * img.naturalWidth;
    const sy = (crop.y / 100) * img.naturalHeight;
    const sw = (crop.width / 100) * img.naturalWidth;
    const sh = (crop.height / 100) * img.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    onApply({
      png: canvas.toDataURL("image/png"),
      jpeg: canvas.toDataURL("image/jpeg", 0.9),
    });
  }

  return (
    <div
      className={backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Adjust the ${LABELS[region.kind]} crop`}
    >
      <div className={panel} onClick={(e) => e.stopPropagation()}>
        <div className={head}>
          <div>
            <h2 className={title}>Adjust crop</h2>
            <p className={subtitle}>
              Drag the handles to include less or more of the page, then apply.
            </p>
          </div>
          <button className={close} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={stage}>
          <ReactCrop crop={crop} onChange={(_, percent) => setCrop(percent)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              className={image}
              src={page.image}
              alt={`Page ${page.index + 1}`}
            />
          </ReactCrop>
        </div>

        <div className={foot}>
          <button
            type="button"
            className={hint}
            onClick={() => setCrop(initial)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            ↺ Reset to detected
          </button>
          <div className={footActions}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={apply}>
              Apply crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const backdrop = css`
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(28, 27, 23, 0.45);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: ${theme.space[5]};
`;

const panel = css`
  width: 100%;
  max-width: 640px;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  background-color: ${theme.color.paper};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.lg};
  overflow: hidden;
`;

const head = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.space[4]};
  padding: ${theme.space[6]};
  padding-bottom: ${theme.space[3]};
`;

const title = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.xl};
  margin: 0;
`;

const subtitle = css`
  margin-top: ${theme.space[1]};
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
`;

const close = css`
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: ${theme.radius.full};
  border: 1px solid ${theme.color.line};
  background: ${theme.color.surface};
  color: ${theme.color.inkMuted};
  cursor: pointer;

  &:hover {
    color: ${theme.color.ink};
  }
`;

// Scrollable crop stage with the same checkerboard as the region preview.
const stage = css`
  flex: 1;
  overflow: auto;
  margin-inline: ${theme.space[6]};
  border-radius: ${theme.radius.md};
  border: 1px solid ${theme.color.line};
  background-color: ${theme.color.surfaceSunken};
  background-image: linear-gradient(45deg, ${theme.color.line} 25%, transparent 25%),
    linear-gradient(-45deg, ${theme.color.line} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${theme.color.line} 75%),
    linear-gradient(-45deg, transparent 75%, ${theme.color.line} 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  display: grid;
  place-items: center;
  padding: ${theme.space[4]};
`;

const image = css`
  display: block;
  max-width: 100%;
  max-height: 56dvh;
`;

const foot = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  padding: ${theme.space[6]};
  padding-top: ${theme.space[4]};
`;

const hint = css`
  font-size: ${theme.fontSize.xs};
  color: ${theme.color.inkSubtle};
  font-family: ${theme.font.mono};
`;

const footActions = css`
  display: flex;
  gap: ${theme.space[2]};
`;
