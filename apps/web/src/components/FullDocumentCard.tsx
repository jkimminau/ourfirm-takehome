"use client";

import { cx } from "@linaria/core";

import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { DownloadIcon } from "@/components/ui/icons";
import { baseName, downloadDataUrl } from "@/lib/download";
import type { FullDocumentImages } from "@/lib/fullDocument";
import {
  card,
  head,
  name,
  previewWell,
  previewImg,
  foot,
  actions,
  iconBtn,
  iconBtnAlt,
} from "@/components/RegionCard";

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
    <div className={card}>
      <div className={head}>
        <span className={name}>Full document</span>
        <Badge tone="neutral">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </Badge>
      </div>

      <div className={previewWell}>
        {images ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className={previewImg} src={images.png} alt="Full document" />
        ) : (
          <Spinner />
        )}
      </div>

      <div className={foot}>
        <span />
        <div className={actions}>
          <button
            type="button"
            className={iconBtn}
            disabled={!images}
            title="Download PNG"
            onClick={() => download("png")}
          >
            <DownloadIcon width={14} height={14} />
            PNG
          </button>
          <button
            type="button"
            className={cx(iconBtn, iconBtnAlt)}
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
