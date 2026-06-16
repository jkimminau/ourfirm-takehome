"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  isDetected,
  type ExtractionResult,
  type RegionImages,
  type RegionKind,
} from "@ourfirm/shared";
import { RegionCard } from "./RegionCard";
import { FullDocumentCard } from "./FullDocumentCard";
import { CropEditor } from "./CropEditor";
import { Button } from "./ui/Button";
import { DownloadIcon } from "./ui/icons";
import {
  buildFullDocumentImages,
  type FullDocumentImages,
} from "../lib/fullDocument";
import { downloadAllZip } from "../lib/zip";
import * as s from "./ResultsPanel.css";

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
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <h2 className={s.heading}>Extracted regions</h2>
          <p className={s.summary}>
            {found} of {total} regions detected · download each as PNG or JPEG
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleZip} disabled={zipping}>
          <DownloadIcon width={15} height={15} />
          {zipping ? "Zipping…" : "Download all (.zip)"}
        </Button>
      </div>

      <motion.div
        className={s.list}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={reveal}>
          <FullDocumentCard
            images={fullDoc}
            pageCount={result.pageCount}
            fileName={result.fileName}
          />
        </motion.div>
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
