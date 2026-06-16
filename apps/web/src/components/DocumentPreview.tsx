"use client";

import type { PagePreview } from "@ourfirm/shared";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import * as s from "./DocumentPreview.css";

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
    <div className={s.panel}>
      <div className={s.bar}>
        <span className={s.fileName} title={fileName}>
          {fileName}
        </span>
        {pageCount !== undefined && (
          <Badge tone="neutral">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </Badge>
        )}
      </div>

      {loading || !previews ? (
        <div className={s.loading}>
          <Spinner />
          <span>Rendering preview…</span>
        </div>
      ) : (
        <div className={s.scroll}>
          {previews.map((page) => (
            <figure key={page.index} className={s.pageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.pageImg}
                src={page.image}
                width={page.width}
                height={page.height}
                alt={`Page ${page.index + 1}`}
              />
              {previews.length > 1 && (
                <figcaption className={s.pageLabel}>
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
