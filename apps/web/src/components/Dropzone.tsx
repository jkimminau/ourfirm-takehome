"use client";

import { useCallback, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
          onReject("That file isn't a PDF. Please choose a PDF document.");
        } else {
          onReject("That file can't be uploaded. Please choose a single PDF.");
        }
        return;
      }
      const file = accepted[0];
      if (file) accept(file);
    },
    [accept, onReject],
  );

  // We handle the click + file input ourselves (noClick) — react-dropzone's
  // built-in dialog handling could get stuck and not reopen after the native
  // dialog was cancelled. A fresh input.click() always reopens.
  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again (or reopening) still fires onChange.
    event.target.value = "";
    if (file) accept(file);
  }

  return (
    <div
      {...getRootProps()}
      onClick={() => inputRef.current?.click()}
      className={cx(
        s.zone,
        isDragActive && s.dragActive,
        isDragReject && s.rejected,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
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
            Drop a PDF here, or <span className={s.accentText}>browse</span>
          </>
        )}
      </div>
      <p className={s.hint}>
        We&apos;ll extract the letterhead, signature, and footer as images.
      </p>
      <span className={s.note}>PDF · up to {maxMb} MB</span>
    </div>
  );
}
