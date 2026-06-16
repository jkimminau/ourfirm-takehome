"use client";

import { motion } from "framer-motion";
import { isDetected, type ExtractionResult } from "@ourfirm/shared";
import { RegionCard } from "./RegionCard";
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

interface ResultsPanelProps {
  result: ExtractionResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const found = result.regions.filter(isDetected).length;
  const total = result.regions.length;

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <h2 className={s.heading}>Extracted regions</h2>
          <p className={s.summary}>
            {found} of {total} regions detected · download each as PNG or JPEG
          </p>
        </div>
      </div>

      <motion.div
        className={s.list}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {result.regions.map((region) => (
          <motion.div key={region.kind} variants={reveal}>
            <RegionCard region={region} sourceFileName={result.fileName} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
