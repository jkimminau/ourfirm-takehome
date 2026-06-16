"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { css, cx } from "@linaria/core";
import { MAX_UPLOAD_BYTES } from "@ourfirm/shared";

import { quickValidate } from "@/lib/api";
import { theme } from "@/styles/theme";

interface DropzoneProps {
  onFile: (file: File) => void;
  onReject: (message: string) => void;
}

const maxMb = Math.round(MAX_UPLOAD_BYTES / 1048576);

export function Dropzone({ onFile, onReject }: DropzoneProps) {
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
      if (!file) return;
      const problem = quickValidate(file);
      if (problem) onReject(problem);
      else onFile(file);
    },
    [onFile, onReject],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
      },
      maxFiles: 1,
      maxSize: MAX_UPLOAD_BYTES,
      multiple: false,
    });

  return (
    <div
      {...getRootProps()}
      className={cx(
        zone,
        isDragActive && dragActive,
        isDragReject && rejected,
      )}
    >
      <input {...getInputProps()} />
      <span className={seal} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </span>
      <div className={title}>
        {isDragActive ? (
          <span className={accentText}>Drop it here</span>
        ) : (
          <>
            Drop a document here, or <span className={accentText}>browse</span>
          </>
        )}
      </div>
      <p className={hint}>
        We&apos;ll extract the letterhead, signature, and footer as images.
      </p>
      <span className={note}>PDF · PNG · JPG · DOCX up to {maxMb} MB</span>
    </div>
  );
}

const zone = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[3]};
  text-align: center;
  padding: ${theme.space[8]} ${theme.space[8]};
  background-color: ${theme.color.surface};
  border: 2px dashed ${theme.color.lineStrong};
  border-radius: ${theme.radius.xl};
  cursor: pointer;
  transition-property: border-color, background-color, transform;
  transition-duration: ${theme.duration.base};

  &:hover {
    border-color: ${theme.color.inkSubtle};
    background-color: ${theme.color.paper};
  }
`;

const dragActive = css`
  border-color: ${theme.color.accent};
  background-color: ${theme.color.accentSoft};
  transform: scale(1.005);
`;

const rejected = css`
  border-color: ${theme.color.danger};
  background-color: ${theme.color.dangerSoft};
`;

const seal = css`
  width: 48px;
  height: 48px;
  border-radius: ${theme.radius.full};
  background-color: ${theme.color.accentSoft};
  color: ${theme.color.accent};
  display: grid;
  place-items: center;
`;

const title = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.xl};
  color: ${theme.color.ink};
`;

const accentText = css`
  color: ${theme.color.accent};
`;

const hint = css`
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
`;

const note = css`
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkSubtle};
`;
