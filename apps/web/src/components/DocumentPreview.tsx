"use client";

import { css } from "@linaria/core";
import type { PagePreview } from "@ourfirm/shared";

import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { theme } from "@/styles/theme";

interface DocumentPreviewProps {
  fileName: string;
  pageCount?: number;
  previews?: PagePreview[];
  loading?: boolean;
}

/**
 * Renders the document as server-rasterized page images. This always paints
 * (it's just <img>), matches exactly what the engine analysed, and never
 * depends on the browser's built-in PDF viewer.
 */
export function DocumentPreview({
  fileName,
  pageCount,
  previews,
  loading,
}: DocumentPreviewProps) {
  return (
    <div className={panel}>
      <div className={bar}>
        <span className={fileName_} title={fileName}>
          {fileName}
        </span>
        {pageCount !== undefined && (
          <Badge tone="neutral">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </Badge>
        )}
      </div>

      {loading || !previews ? (
        <div className={loadingStyle}>
          <Spinner />
          <span>Rendering preview…</span>
        </div>
      ) : (
        <div className={scroll}>
          {previews.map((page) => (
            <figure key={page.index} className={pageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={pageImg}
                src={page.image}
                width={page.width}
                height={page.height}
                alt={`Page ${page.index + 1}`}
              />
              {previews.length > 1 && (
                <figcaption className={pageLabel}>
                  Page {page.index + 1}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

const panel = css`
  display: flex;
  flex-direction: column;
  background-color: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  max-height: calc(100dvh - 6rem);
  min-height: 420px;
`;

const bar = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  padding-inline: ${theme.space[4]};
  padding-block: ${theme.space[3]};
  border-bottom: 1px solid ${theme.color.line};
`;

const fileName_ = css`
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  color: ${theme.color.inkMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const scroll = css`
  flex: 1;
  overflow-y: auto;
  background-color: ${theme.color.surfaceSunken};
  padding: ${theme.space[5]};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[5]};
`;

const pageWrap = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space[2]};
  width: 100%;
`;

const pageImg = css`
  width: 100%;
  height: auto;
  border-radius: ${theme.radius.sm};
  border: 1px solid ${theme.color.line};
  box-shadow: ${theme.shadow.md};
  background-color: ${theme.color.surface};
`;

const pageLabel = css`
  font-family: ${theme.font.mono};
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkSubtle};
`;

const loadingStyle = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[3]};
  color: ${theme.color.inkMuted};
  font-size: ${theme.fontSize.sm};
  background-color: ${theme.color.surfaceSunken};
`;
