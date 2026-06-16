"use client";

import { useEffect, useState } from "react";
import { css } from "@linaria/core";
import { motion } from "framer-motion";
import {
  isDetected,
  type ExtractionResult,
  type RegionImages,
  type RegionKind,
} from "@ourfirm/shared";

import { RegionCard } from "@/components/RegionCard";
import { FullDocumentCard } from "@/components/FullDocumentCard";
import { CropEditor } from "@/components/CropEditor";
import { Button } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/icons";
import {
  buildFullDocumentImages,
  type FullDocumentImages,
} from "@/lib/fullDocument";
import { downloadAllZip } from "@/lib/zip";
import { theme } from "@/styles/theme";

const reveal = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

type Overrides = Partial<Record<RegionKind, RegionImages>>;

interface ResultsPanelProps {
  result: ExtractionResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const found = result.regions.filter(isDetected).length;
  const total = result.regions.length;

  const [fullDoc, setFullDoc] = useState<FullDocumentImages | null>(null);
  const [zipping, setZipping] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editing, setEditing] = useState<RegionKind | null>(null);

  // Reset per-document state and stitch the full-document image when results land.
  useEffect(() => {
    let active = true;
    setFullDoc(null);
    setOverrides({});
    setEditing(null);
    buildFullDocumentImages(result.previews)
      .then((images) => active && setFullDoc(images))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [result]);

  async function handleZip() {
    setZipping(true);
    try {
      await downloadAllZip(result, fullDoc, overrides);
    } finally {
      setZipping(false);
    }
  }

  const editingRegion = result.regions.find(
    (r) => r.kind === editing && isDetected(r),
  );
  const editingPage =
    editingRegion && isDetected(editingRegion)
      ? result.previews[editingRegion.page.index]
      : undefined;

  return (
    <div className={wrap}>
      <div className={head}>
        <div>
          <h2 className={heading}>Extracted regions</h2>
          <p className={summary}>
            {found} of {total} regions detected · download each as PNG or JPEG
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleZip} disabled={zipping}>
          <DownloadIcon width={15} height={15} />
          {zipping ? "Zipping…" : "Download all (.zip)"}
        </Button>
      </div>

      {result.notice && (
        <p className={notice} role="status">
          {result.notice}
        </p>
      )}

      <motion.div
        className={list}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {result.regions.map((region) => (
          <motion.div key={region.kind} variants={reveal}>
            <RegionCard
              region={region}
              sourceFileName={result.fileName}
              override={isDetected(region) ? overrides[region.kind] : undefined}
              onAdjust={
                isDetected(region) ? () => setEditing(region.kind) : undefined
              }
            />
          </motion.div>
        ))}
        <motion.div variants={reveal}>
          <FullDocumentCard
            images={fullDoc}
            pageCount={result.pageCount}
            fileName={result.fileName}
          />
        </motion.div>
      </motion.div>

      {editingRegion && isDetected(editingRegion) && editingPage && (
        <CropEditor
          region={editingRegion}
          page={editingPage}
          onClose={() => setEditing(null)}
          onApply={(images) => {
            setOverrides((prev) => ({ ...prev, [editingRegion.kind]: images }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

const wrap = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[4]};
`;

const head = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  flex-wrap: wrap;
`;

const heading = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.xl};
`;

const summary = css`
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
`;

const list = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[4]};
`;

const notice = css`
  font-size: ${theme.fontSize.sm};
  line-height: ${theme.lineHeight.normal};
  color: ${theme.color.warning};
  background-color: ${theme.color.warningSoft};
  border-radius: ${theme.radius.md};
  padding: ${theme.space[3]} ${theme.space[4]};
`;
