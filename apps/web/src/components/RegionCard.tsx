"use client";

import { css, cx } from "@linaria/core";
import type { ImageFormat, Region, RegionImages } from "@ourfirm/shared";
import { isDetected } from "@ourfirm/shared";

import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/CopyButton";
import { DownloadIcon, ChevronIcon, CropIcon } from "@/components/ui/icons";
import { downloadDataUrl, regionFileName } from "@/lib/download";
import { confidenceTier, TIER_LABEL } from "@/lib/confidence";
import { theme } from "@/styles/theme";

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
      <div className={card}>
        <div className={head}>
          <span className={name}>{LABELS[region.kind]}</span>
          <Badge tone="neutral">Not found</Badge>
        </div>
        <div className={missing}>
          <span>{region.message}</span>
        </div>
        <div className={foot} />
      </div>
    );
  }

  const tier = confidenceTier(region.confidence);
  const pct = Math.round(region.confidence * 100);
  const text = region.text.trim();
  const images = override ?? region.images;

  return (
    <div className={card}>
      <div className={head}>
        <span className={name}>{LABELS[region.kind]}</span>
        <span className={headBadges}>
          {override && <Badge tone="accent">Cropped</Badge>}
          {region.detectedBy === "ai" && <Badge tone="accent">AI</Badge>}
          <Badge tone="positive">Detected</Badge>
        </span>
      </div>

      <div className={previewWell}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={previewImg} src={images.png} alt={`Extracted ${region.kind}`} />
      </div>

      <details className={details}>
        <summary className={summary}>
          <ChevronIcon className={chevron} width={14} height={14} />
          Text content
        </summary>
        {text ? (
          <>
            <div className={textBox}>{text}</div>
            <div className={copyRow}>
              <CopyButton text={text} />
            </div>
          </>
        ) : (
          <p className={emptyText}>
            No selectable text in this region (it&apos;s likely drawn ink).
          </p>
        )}
      </details>

      <div className={foot}>
        <span className={confidence} title={TIER_LABEL[tier]}>
          <span className={cx(dot, tierDot[tier])} aria-hidden />
          <span className={tierText[tier]}>
            {pct}% · {TIER_LABEL[tier]}
          </span>
        </span>
        <div className={actions}>
          {onAdjust && (
            <button type="button" className={ghostAction} onClick={onAdjust}>
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
      className={cx(iconBtn, alt && iconBtnAlt)}
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

export const card = css`
  display: flex;
  flex-direction: column;
  background-color: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.lg};
  overflow: hidden;
`;

export const head = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.space[4]};
  padding-bottom: ${theme.space[3]};
`;

export const name = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
`;

const headBadges = css`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
`;

// Checkerboard so PNG transparency reads clearly behind the crop.
export const previewWell = css`
  position: relative;
  margin-inline: ${theme.space[4]};
  border-radius: ${theme.radius.md};
  border: 1px solid ${theme.color.line};
  min-height: 120px;
  display: grid;
  place-items: center;
  padding: ${theme.space[3]};
  overflow: hidden;
  background-color: ${theme.color.surfaceSunken};
  background-image: linear-gradient(45deg, ${theme.color.line} 25%, transparent 25%),
    linear-gradient(-45deg, ${theme.color.line} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${theme.color.line} 75%),
    linear-gradient(-45deg, transparent 75%, ${theme.color.line} 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
`;

export const previewImg = css`
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: ${theme.radius.sm};
  box-shadow: ${theme.shadow.sm};
`;

const missing = css`
  margin-inline: ${theme.space[4]};
  border-radius: ${theme.radius.md};
  border: 1px dashed ${theme.color.lineStrong};
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[2]};
  padding: ${theme.space[5]};
  text-align: center;
  color: ${theme.color.inkMuted};
  font-size: ${theme.fontSize.sm};
  line-height: ${theme.lineHeight.normal};
`;

/* ---- collapsible text content ---------------------------------------- */
const details = css`
  margin-inline: ${theme.space[4]};
  margin-top: ${theme.space[4]};
  border-top: 1px solid ${theme.color.line};
`;

const summary = css`
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
  padding-block: ${theme.space[3]};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkMuted};

  &::-webkit-details-marker {
    display: none;
  }
  &:hover {
    color: ${theme.color.ink};
  }
`;

const chevron = css`
  transition: transform ${theme.duration.fast};
  details[open] & {
    transform: rotate(90deg);
  }
`;

const textBox = css`
  margin-bottom: ${theme.space[4]};
  max-height: 180px;
  overflow-y: auto;
  padding: ${theme.space[3]};
  background-color: ${theme.color.surfaceSunken};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.md};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  line-height: ${theme.lineHeight.relaxed};
  color: ${theme.color.ink};
  white-space: pre-wrap;
  user-select: text;
`;

const emptyText = css`
  margin-bottom: ${theme.space[4]};
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkSubtle};
  font-style: italic;
`;

const copyRow = css`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.space[2]};
`;

/* ---- footer: confidence + downloads ---------------------------------- */
export const foot = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  row-gap: ${theme.space[2]};
  flex-wrap: wrap;
  padding: ${theme.space[4]};
`;

// "Adjust crop" — a quieter, borderless action distinct from the downloads.
const ghostAction = css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkMuted};
  background: transparent;
  border: none;
  border-radius: ${theme.radius.md};
  padding: ${theme.space[2]} ${theme.space[2]};
  cursor: pointer;
  transition-property: color, background-color;
  transition-duration: ${theme.duration.fast};

  &:hover {
    color: ${theme.color.ink};
    background-color: ${theme.color.surfaceSunken};
  }
`;

const confidence = css`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
`;

const dot = css`
  width: 7px;
  height: 7px;
  border-radius: ${theme.radius.full};
  flex-shrink: 0;
`;

const tierDot = {
  high: css`
    background-color: ${theme.color.positive};
  `,
  moderate: css`
    background-color: ${theme.color.warning};
  `,
  low: css`
    background-color: ${theme.color.danger};
  `,
};

const tierText = {
  high: css`
    color: ${theme.color.inkMuted};
  `,
  moderate: css`
    color: ${theme.color.warning};
  `,
  low: css`
    color: ${theme.color.danger};
  `,
};

export const actions = css`
  display: flex;
  gap: ${theme.space[2]};
  flex-shrink: 0;
`;

export const iconBtn = css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[1]};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.onAccent};
  background-color: ${theme.color.accent};
  border: 1px solid transparent;
  border-radius: ${theme.radius.md};
  padding: ${theme.space[2]} ${theme.space[3]};
  cursor: pointer;
  transition-property: background-color, transform;
  transition-duration: ${theme.duration.fast};

  &:hover:not(:disabled) {
    background-color: ${theme.color.accentHover};
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Second format gets a quieter, outline treatment to reduce visual weight.
export const iconBtnAlt = css`
  color: ${theme.color.ink};
  background-color: ${theme.color.surface};
  border-color: ${theme.color.lineStrong};

  &:hover {
    background-color: ${theme.color.surfaceSunken};
    border-color: ${theme.color.ink};
  }
`;
