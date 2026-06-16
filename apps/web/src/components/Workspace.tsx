"use client";

import { css } from "@linaria/core";
import type { ExtractionResult } from "@ourfirm/shared";

import { DocumentPreview } from "@/components/DocumentPreview";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ErrorState } from "@/components/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { theme } from "@/styles/theme";

export type WorkspaceStatus = "extracting" | "done" | "error";

interface WorkspaceProps {
  file: File;
  status: WorkspaceStatus;
  result: ExtractionResult | null;
  error: { message: string; detail?: string } | null;
  onReset: () => void;
}

export function Workspace({
  file,
  status,
  result,
  error,
  onReset,
}: WorkspaceProps) {
  // On error there's nothing to preview (the file was rejected or unreadable),
  // so show a single, focused error panel rather than a dead preview pane.
  if (status === "error" && error) {
    return (
      <div className={errorWrap}>
        <ErrorState message={error.message} detail={error.detail} onRetry={onReset} />
      </div>
    );
  }

  return (
    <div className={grid}>
      <div className={previewCol}>
        <DocumentPreview
          fileName={result?.fileName ?? file.name}
          pageCount={result?.pageCount}
          previews={result?.previews}
          loading={status === "extracting"}
        />
      </div>

      <div>
        {status === "extracting" && (
          <div className={processing}>
            <Spinner />
            <span className={processingTitle}>Extracting regions…</span>
            <span className={processingHint}>
              Rasterizing the document and locating the letterhead, signature,
              and footer.
            </span>
          </div>
        )}

        {status === "done" && result && <ResultsPanel result={result} />}
      </div>
    </div>
  );
}

const grid = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${theme.space[6]};
  align-items: start;
  padding-top: ${theme.space[8]};
  padding-bottom: ${theme.space[16]};

  @media screen and (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const previewCol = css`
  position: sticky;
  top: ${theme.space[6]};

  @media screen and (max-width: 920px) {
    position: static;
  }
`;

const errorWrap = css`
  max-width: ${theme.size.narrow};
  margin-inline: auto;
  padding-top: ${theme.space[12]};
  padding-bottom: ${theme.space[20]};
`;

const processing = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.space[4]};
  min-height: 320px;
  padding: ${theme.space[8]};
  background-color: ${theme.color.surface};
  border: 1px solid ${theme.color.line};
  border-radius: ${theme.radius.lg};
  text-align: center;
`;

const processingTitle = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.lg};
`;

const processingHint = css`
  font-size: ${theme.fontSize.sm};
  color: ${theme.color.inkMuted};
  max-width: 32ch;
`;
