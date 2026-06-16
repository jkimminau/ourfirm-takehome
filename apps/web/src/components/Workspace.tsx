"use client";

import type { ExtractionResult, ImageFormat } from "@ourfirm/shared";
import { DocumentPreview } from "./DocumentPreview";
import { ResultsPanel } from "./ResultsPanel";
import { ErrorState } from "./ErrorState";
import { Spinner } from "./ui/Spinner";
import * as s from "./Workspace.css";

export type WorkspaceStatus = "extracting" | "done" | "error";

interface WorkspaceProps {
  file: File;
  status: WorkspaceStatus;
  result: ExtractionResult | null;
  error: { message: string; detail?: string } | null;
  format: ImageFormat;
  onFormatChange: (format: ImageFormat) => void;
  onReset: () => void;
}

export function Workspace({
  file,
  status,
  result,
  error,
  format,
  onFormatChange,
  onReset,
}: WorkspaceProps) {
  // On error there's nothing to preview (the file was rejected or unreadable),
  // so show a single, focused error panel rather than a dead preview pane.
  if (status === "error" && error) {
    return (
      <div className={s.errorWrap}>
        <ErrorState message={error.message} detail={error.detail} onRetry={onReset} />
      </div>
    );
  }

  return (
    <div className={s.grid}>
      <div className={s.previewCol}>
        <DocumentPreview
          fileName={result?.fileName ?? file.name}
          pageCount={result?.pageCount}
          previews={result?.previews}
          loading={status === "extracting"}
        />
      </div>

      <div>
        {status === "extracting" && (
          <div className={s.processing}>
            <Spinner />
            <span className={s.processingTitle}>Extracting regions…</span>
            <span className={s.processingHint}>
              Rasterizing the document and locating the letterhead, signature,
              and footer.
            </span>
          </div>
        )}

        {status === "done" && result && (
          <ResultsPanel
            result={result}
            format={format}
            onFormatChange={onFormatChange}
          />
        )}
      </div>
    </div>
  );
}
