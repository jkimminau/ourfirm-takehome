"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "./ui/Badge";
import { SAMPLE_DOCS, type SampleDoc } from "../lib/samples";
import * as s from "./SamplePicker.css";

interface SamplePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sample: SampleDoc) => void;
}

const valid = SAMPLE_DOCS.filter((d) => d.kind === "valid");
const errors = SAMPLE_DOCS.filter((d) => d.kind === "error");

export function SamplePicker({ open, onClose, onSelect }: SamplePickerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Choose a sample document"
        >
          <motion.div
            className={s.panel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={s.head}>
              <div>
                <h2 className={s.title}>Try a sample</h2>
                <p className={s.subtitle}>
                  Pick a document to run through the extractor.
                </p>
              </div>
              <button className={s.close} onClick={onClose} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={s.list}>
              {valid.map((doc) => (
                <SampleItem key={doc.file} doc={doc} onSelect={onSelect} />
              ))}
              <span className={s.groupLabel}>Error handling</span>
              {errors.map((doc) => (
                <SampleItem key={doc.file} doc={doc} onSelect={onSelect} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SampleItem({
  doc,
  onSelect,
}: {
  doc: SampleDoc;
  onSelect: (sample: SampleDoc) => void;
}) {
  return (
    <button type="button" className={s.item} onClick={() => onSelect(doc)}>
      <div className={s.itemHead}>
        <span className={s.itemName}>{doc.name}</span>
        <Badge tone={doc.kind === "error" ? "danger" : "neutral"}>
          {doc.meta}
        </Badge>
      </div>
      <p className={s.itemDesc}>{doc.description}</p>
    </button>
  );
}
