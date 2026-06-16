"use client";

import { useCallback, useId } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { MAX_UPLOAD_BYTES } from "@ourfirm/shared";
import { cx } from "../lib/cx";
import { quickValidate } from "../lib/api";
import * as s from "./Dropzone.css";

interface DropzoneProps {
  onFile: (file: File) => void;
  onReject: (message: string) => void;
}

const maxMb = Math.round(MAX_UPLOAD_BYTES / 1048576);

export function Dropzone({ onFile, onReject }: DropzoneProps) {
  const inputId = useId();

  // Shared validate-then-accept for both drag-drop and the file picker.
  const accept = useCallback(
    (file: File) => {
      const problem = quickValidate(file);
      if (problem) onReject(problem);
      else onFile(file);
    },
    [onFile, onReject],
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const code = rejections[0]?.errors[0]?.code;
        if (code === "file-too-large") {
          onReject(`That file is larger than the ${maxMb} MB limit.`);
        } else if (code === "file-invalid-type") {
          onReject("Unsupported file. Upload a PDF, image (PNG/JPG), or Word (.docx).");
        } else {
          onReject("That file can't be uploaded. Please choose a single document.");
        }
        return;
      }
      const file = accepted[0];
      if (file) accept(file);
    },
    [accept, onReject],
  );

  // react-dropzone handles drag-and-drop only (noClick); the click-to-browse is
  // a native <label htmlFor> → <input>. No programmatic .click(), so nothing
  // bubbles back into a handler, and the picker reliably reopens after a cancel.
  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (file) accept(file);
  }

  return (
    <label
      {...getRootProps()}
      htmlFor={inputId}
      className={cx(
        s.zone,
        isDragActive && s.dragActive,
        isDragReject && s.rejected,
      )}
    >
      <input
        id={inputId}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={handleInputChange}
      />
      <span className={s.seal} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </span>
      <div className={s.title}>
        {isDragActive ? (
          <span className={s.accentText}>Drop it here</span>
        ) : (
          <>
            Drop a document here, or <span className={s.accentText}>browse</span>
          </>
        )}
      </div>
      <p className={s.hint}>
        We&apos;ll extract the letterhead, signature, and footer as images.
      </p>
      <span className={s.note}>PDF · PNG · JPG · DOCX up to {maxMb} MB</span>
    </label>
  );
}
