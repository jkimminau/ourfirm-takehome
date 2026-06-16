"use client";

import { useEffect } from "react";
import { css } from "@linaria/core";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { SAMPLE_DOCS, type SampleDoc } from "@/lib/samples";
import { theme } from "@/styles/theme";

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
          className={backdrop}
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
            className={panel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={head}>
              <div>
                <h2 className={title}>Try a sample</h2>
                <p className={subtitle}>
                  Pick a document to run through the extractor.
                </p>
              </div>
              <button className={close} onClick={onClose} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={list}>
              {valid.map((doc) => (
                <SampleItem key={doc.file} doc={doc} onSelect={onSelect} />
              ))}
              <span className={groupLabel}>Error handling</span>
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
    <button type="button" className={item} onClick={() => onSelect(doc)}>
      <div className={itemHead}>
        <span className={itemName}>{doc.name}</span>
        <Badge tone={doc.kind === "error" ? "danger" : "neutral"}>
          {doc.meta}
        </Badge>
      </div>
      <p className={itemDesc}>{doc.description}</p>
    </button>
  );
}

const backdrop = css`
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(28, 27, 23, 0.45);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: ${theme.space[5]};
`;

const panel = css`
  width: 100%;
  max-width: 560px;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  background-color: ${theme.color.paper};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.xl};
  box-shadow: ${theme.shadow.lg};
  overflow: hidden;
`;

const head = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.space[4]};
  padding: ${theme.space[6]};
  padding-bottom: ${theme.space[4]};
`;

const title = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize["2xl"]};
  margin: 0;
`;

const subtitle = css`
  margin-top: ${theme.space[1]};
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
`;

const close = css`
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: ${theme.radius.full};
  border: 1px solid ${theme.color.line};
  background: ${theme.color.surface};
  color: ${theme.color.inkMuted};
  cursor: pointer;
  transition-property: color, border-color, background-color;
  transition-duration: ${theme.duration.fast};

  &:hover {
    color: ${theme.color.ink};
    border-color: ${theme.color.lineStrong};
  }
`;

const list = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[3]};
  padding: ${theme.space[6]};
  padding-top: ${theme.space[2]};
  overflow-y: auto;
`;

const groupLabel = css`
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wider};
  color: ${theme.color.inkSubtle};
  margin-top: ${theme.space[2]};
`;

const item = css`
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  background: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.lg};
  padding: ${theme.space[4]};
  transition-property: border-color, box-shadow, transform;
  transition-duration: ${theme.duration.fast};

  &:hover {
    border-color: ${theme.color.accent};
    box-shadow: ${theme.shadow.sm};
    transform: translateY(-1px);
  }
`;

const itemHead = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space[3]};
  margin-bottom: ${theme.space[2]};
`;

const itemName = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
`;

const itemDesc = css`
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
  line-height: ${theme.lineHeight.normal};
`;
