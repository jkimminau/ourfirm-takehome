"use client";

import type { ImageFormat, Region, RegionImages } from "@ourfirm/shared";
import { isDetected } from "@ourfirm/shared";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./CopyButton";
import { DownloadIcon, ChevronIcon, CropIcon } from "./ui/icons";
import { cx } from "../lib/cx";
import { downloadDataUrl, regionFileName } from "../lib/download";
import { confidenceTier, TIER_LABEL } from "../lib/confidence";
import * as s from "./RegionCard.css";

const LABELS: Record<Region["kind"], string> = {
  letterhead: "Letterhead",
  signature: "Signature",
  footer: "Footer",
};

interface RegionCardProps {
  region: Region;
  sourceFileName: string;
  /** Adjusted crop, if the user re-cropped this region. */
  override?: RegionImages;
  onAdjust?: () => void;
}

export function RegionCard({
  region,
  sourceFileName,
  override,
  onAdjust,
}: RegionCardProps) {
  if (!isDetected(region)) {
    return (
      <div className={s.card}>
        <div className={s.head}>
          <span className={s.name}>{LABELS[region.kind]}</span>
          <Badge tone="neutral">Not found</Badge>
        </div>
        <div className={s.missing}>
          <span>{region.message}</span>
        </div>
        <div className={s.foot} />
      </div>
    );
  }

  const tier = confidenceTier(region.confidence);
  const pct = Math.round(region.confidence * 100);
  const text = region.text.trim();
  const images = override ?? region.images;

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.name}>{LABELS[region.kind]}</span>
        <span className={s.headBadges}>
          {override && <Badge tone="accent">Cropped</Badge>}
          {region.detectedBy === "ai" && <Badge tone="accent">AI</Badge>}
          <Badge tone="positive">Detected</Badge>
        </span>
      </div>

      <div className={s.previewWell}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.previewImg} src={images.png} alt={`Extracted ${region.kind}`} />
      </div>

      <details className={s.details}>
        <summary className={s.summary}>
          <ChevronIcon className={s.chevron} width={14} height={14} />
          Text content
        </summary>
        {text ? (
          <>
            <div className={s.textBox}>{text}</div>
            <div className={s.copyRow}>
              <CopyButton text={text} />
            </div>
          </>
        ) : (
          <p className={s.emptyText}>
            No selectable text in this region (it&apos;s likely drawn ink).
          </p>
        )}
      </details>

      <div className={s.foot}>
        <span className={s.confidence} title={TIER_LABEL[tier]}>
          <span className={cx(s.dot, s.tierDot[tier])} aria-hidden />
          <span className={s.tierText[tier]}>
            {pct}% · {TIER_LABEL[tier]}
          </span>
        </span>
        <div className={s.actions}>
          {onAdjust && (
            <button type="button" className={s.ghostAction} onClick={onAdjust}>
              <CropIcon width={14} height={14} />
              Adjust
            </button>
          )}
          <DownloadButton images={images} sourceFileName={sourceFileName} kind={region.kind} format="png" />
          <DownloadButton images={images} sourceFileName={sourceFileName} kind={region.kind} format="jpeg" alt />
        </div>
      </div>
    </div>
  );
}

function DownloadButton({
  images,
  sourceFileName,
  kind,
  format,
  alt,
}: {
  images: RegionImages;
  sourceFileName: string;
  kind: Region["kind"];
  format: ImageFormat;
  alt?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx(s.iconBtn, alt && s.iconBtnAlt)}
      title={`Download ${format.toUpperCase()}`}
      onClick={() =>
        downloadDataUrl(images[format], regionFileName(sourceFileName, kind, format))
      }
    >
      <DownloadIcon width={14} height={14} />
      {format.toUpperCase()}
    </button>
  );
}
