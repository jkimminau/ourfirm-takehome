"use client";

import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { DownloadIcon } from "./ui/icons";
import { cx } from "../lib/cx";
import { baseName, downloadDataUrl } from "../lib/download";
import type { FullDocumentImages } from "../lib/fullDocument";
import * as s from "./RegionCard.css";

interface FullDocumentCardProps {
  images: FullDocumentImages | null;
  pageCount: number;
  fileName: string;
}

/** The whole document as one downloadable image (regions stitched back together). */
export function FullDocumentCard({
  images,
  pageCount,
  fileName,
}: FullDocumentCardProps) {
  const download = (format: "png" | "jpeg") => {
    if (!images) return;
    downloadDataUrl(images[format], `${baseName(fileName)}-full-document.${format}`);
  };

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.name}>Full document</span>
        <Badge tone="neutral">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </Badge>
      </div>

      <div className={s.previewWell}>
        {images ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className={s.previewImg} src={images.png} alt="Full document" />
        ) : (
          <Spinner />
        )}
      </div>

      <div className={s.foot}>
        <span />
        <div className={s.actions}>
          <button
            type="button"
            className={s.iconBtn}
            disabled={!images}
            title="Download PNG"
            onClick={() => download("png")}
          >
            <DownloadIcon width={14} height={14} />
            PNG
          </button>
          <button
            type="button"
            className={cx(s.iconBtn, s.iconBtnAlt)}
            disabled={!images}
            title="Download JPEG"
            onClick={() => download("jpeg")}
          >
            <DownloadIcon width={14} height={14} />
            JPEG
          </button>
        </div>
      </div>
    </div>
  );
}
