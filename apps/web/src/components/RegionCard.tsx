"use client";

import type { ImageFormat, Region } from "@ourfirm/shared";
import { isDetected } from "@ourfirm/shared";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./CopyButton";
import { DownloadIcon, ChevronIcon } from "./ui/icons";
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
}

export function RegionCard({ region, sourceFileName }: RegionCardProps) {
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

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.name}>{LABELS[region.kind]}</span>
        <Badge tone="positive">Detected</Badge>
      </div>

      <div className={s.previewWell}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.previewImg} src={region.images.png} alt={`Extracted ${region.kind}`} />
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
          <DownloadFormatButton region={region} sourceFileName={sourceFileName} format="png" />
          <DownloadFormatButton
            region={region}
            sourceFileName={sourceFileName}
            format="jpeg"
            alt
          />
        </div>
      </div>
    </div>
  );
}

function DownloadFormatButton({
  region,
  sourceFileName,
  format,
  alt,
}: {
  region: Extract<Region, { status: "detected" }>;
  sourceFileName: string;
  format: ImageFormat;
  alt?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx(s.iconBtn, alt && s.iconBtnAlt)}
      title={`Download ${format.toUpperCase()}`}
      onClick={() =>
        downloadDataUrl(
          region.images[format],
          regionFileName(sourceFileName, region.kind, format),
        )
      }
    >
      <DownloadIcon width={14} height={14} />
      {format.toUpperCase()}
    </button>
  );
}
