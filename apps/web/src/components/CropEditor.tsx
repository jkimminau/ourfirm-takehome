"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type {
  DetectedRegion,
  PagePreview,
  RegionImages,
} from "@ourfirm/shared";
import { Button } from "./ui/Button";
import * as s from "./CropEditor.css";

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
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Adjust the ${LABELS[region.kind]} crop`}
    >
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        <div className={s.head}>
          <div>
            <h2 className={s.title}>Adjust crop</h2>
            <p className={s.subtitle}>
              Drag the handles to include less or more of the page, then apply.
            </p>
          </div>
          <button className={s.close} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={s.stage}>
          <ReactCrop crop={crop} onChange={(_, percent) => setCrop(percent)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              className={s.image}
              src={page.image}
              alt={`Page ${page.index + 1}`}
            />
          </ReactCrop>
        </div>

        <div className={s.foot}>
          <button
            type="button"
            className={s.hint}
            onClick={() => setCrop(initial)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            ↺ Reset to detected
          </button>
          <div className={s.footActions}>
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
