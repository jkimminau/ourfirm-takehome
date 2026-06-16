"use client";

import type { ImageFormat, Region } from "@ourfirm/shared";
import { isDetected } from "@ourfirm/shared";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { downloadDataUrl, regionFileName } from "../lib/download";
import * as s from "./RegionCard.css";

const LABELS: Record<Region["kind"], string> = {
  letterhead: "Letterhead",
  signature: "Signature",
  footer: "Footer",
};

interface RegionCardProps {
  region: Region;
  sourceFileName: string;
  format: ImageFormat;
}

export function RegionCard({ region, sourceFileName, format }: RegionCardProps) {
  const detected = isDetected(region);

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.name}>{LABELS[region.kind]}</span>
        {detected ? (
          <Badge tone="positive">Detected</Badge>
        ) : (
          <Badge tone="neutral">Not found</Badge>
        )}
      </div>

      {detected ? (
        <div className={s.previewWell}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.previewImg}
            src={region.images[format]}
            alt={`Extracted ${region.kind}`}
          />
        </div>
      ) : (
        <div className={s.missing}>
          <span>{region.message}</span>
        </div>
      )}

      <div className={s.foot}>
        {detected ? (
          <span className={s.meta}>
            <span className={s.confidenceDot} aria-hidden />
            {Math.round(region.confidence * 100)}% confidence
          </span>
        ) : (
          <span className={s.meta}>—</span>
        )}
        <Button
          size="sm"
          variant={detected ? "primary" : "secondary"}
          disabled={!detected}
          onClick={() =>
            detected &&
            downloadDataUrl(
              region.images[format],
              regionFileName(sourceFileName, region.kind, format),
            )
          }
        >
          Download {format.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
