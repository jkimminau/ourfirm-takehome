"use client";

import { useCallback, useRef, useState } from "react";
import { css, cx } from "@linaria/core";
import { motion } from "framer-motion";
import type { ExtractionResult } from "@ourfirm/shared";

import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/Dropzone";
import { Workspace } from "@/components/Workspace";
import { SamplePicker } from "@/components/SamplePicker";
import { ApiRequestError, extractDocument } from "@/lib/api";
import { docxToImageFile, isDocxFile } from "@/lib/docx";
import type { SampleDoc } from "@/lib/samples";
import { theme } from "@/styles/theme";

const REPO_URL = "https://github.com/jkimminau/ourfirm-takehome";

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const REGIONS = [
  {
    name: "Letterhead",
    tone: "neutral" as const,
    desc: "The branded header at the top of the first page — logo, sender, and contact details.",
  },
  {
    name: "Signature",
    tone: "accent" as const,
    desc: "Hand-signed ink near the close of the last page, found by ink density and text anchors.",
  },
  {
    name: "Footer",
    tone: "neutral" as const,
    desc: "The fine print along the bottom edge — page numbers, disclaimers, and references.",
  },
];

type Status = "idle" | "extracting" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runExtraction = useCallback(async (f: File) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setFile(f);
    setRejection(null);
    setResult(null);
    setError(null);
    setStatus("extracting");

    try {
      // .docx has no fixed page geometry and isn't accepted by the engine — render
      // it to a page image in the browser, then run it through the image pipeline.
      let upload = f;
      if (isDocxFile(f)) {
        try {
          upload = await docxToImageFile(f);
          if (ac.signal.aborted) return;
          setFile(upload);
        } catch {
          setError({
            message:
              "We couldn't read that Word document. Try exporting it to PDF and uploading that instead.",
          });
          setStatus("error");
          return;
        }
      }

      const res = await extractDocument(upload, ac.signal);
      if (ac.signal.aborted) return;
      setResult(res);
      setStatus("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const apiError = err as ApiRequestError;
      setError({
        message: apiError.message || "Something went wrong. Please try again.",
        detail: apiError.detail,
      });
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    setRejection(null);
  }, []);

  const handleSelectSample = useCallback(
    async (doc: SampleDoc) => {
      setPickerOpen(false);
      try {
        const res = await fetch(doc.file);
        if (!res.ok) throw new Error("missing");
        const blob = await res.blob();
        runExtraction(new File([blob], doc.fileName, { type: blob.type }));
      } catch {
        setRejection("That sample couldn't be loaded. Please try another.");
      }
    },
    [runExtraction],
  );

  const active = status !== "idle";

  return (
    <div className={page}>
      <Container as="header" className={header}>
        <button className={brand} onClick={reset} type="button">
          <span className={seal} aria-hidden />
          Document Extractor
        </button>
        <nav className={headerNav}>
          {active ? (
            <Button variant="secondary" size="sm" onClick={reset}>
              New document
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
              Try a sample
            </Button>
          )}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              View source
            </Button>
          </a>
        </nav>
      </Container>

      <Container>
        {active && file ? (
          <Workspace
            file={file}
            status={status}
            result={result}
            error={error}
            onReset={reset}
          />
        ) : (
          <IdleView
            onFile={runExtraction}
            onReject={setRejection}
            onSample={() => setPickerOpen(true)}
            rejection={rejection}
          />
        )}
      </Container>

      <Container as="footer" className={footer}>
        <span>Built for the OurFirm engineering assessment</span>
      </Container>

      <SamplePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectSample}
      />
    </div>
  );
}

interface IdleViewProps {
  onFile: (file: File) => void;
  onReject: (message: string) => void;
  onSample: () => void;
  rejection: string | null;
}

function IdleView({ onFile, onReject, onSample, rejection }: IdleViewProps) {
  return (
    <>
      <motion.section
        className={hero}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div>
          <motion.div variants={reveal} className={eyebrow}>
            <Badge tone="outline">PDF → PNG / JPEG</Badge>
          </motion.div>
          <motion.h1 variants={reveal} className={title}>
            Extract the signature, letterhead &amp; footer from any{" "}
            <span className={titleAccent}>document</span>.
          </motion.h1>
          <motion.p variants={reveal} className={lede}>
            Upload a PDF and pull each region out as a clean, downloadable image
            — no manual cropping. Built with transparent heuristics, not a black
            box.
          </motion.p>
        </div>

        <motion.div variants={reveal} className={heroMedia}>
          <div className={mockupFrame}>
            <DocumentMockup />
          </div>
          <div>
            <Dropzone onFile={onFile} onReject={onReject} />
            {rejection && (
              <p className={rejectionStyle} role="alert">
                {rejection}{" "}
                <button
                  type="button"
                  className={rejectionAction}
                  onClick={onSample}
                >
                  Try the sample instead
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        className={regions}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {REGIONS.map((region) => (
          <motion.div key={region.name} variants={reveal}>
            <Card interactive className={regionCard}>
              <div className={regionHead}>
                <h2 className={regionName}>{region.name}</h2>
                <Badge tone={region.tone}>{region.name}</Badge>
              </div>
              <p className={regionDesc}>{region.desc}</p>
            </Card>
          </motion.div>
        ))}
      </motion.section>
    </>
  );
}

/** Decorative stylized document illustrating the three extractable regions. */
function DocumentMockup() {
  return (
    <div className={sheet} aria-hidden>
      <div className={cx(zone, zoneLetterhead)}>
        <span className={sealMark} />
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <span className={line} style={{ width: "70%" }} />
          <span className={line} style={{ width: "45%" }} />
        </div>
        <span className={tag}>Letterhead</span>
      </div>

      <div className={zoneBody}>
        <span className={line} style={{ width: "100%" }} />
        <span className={line} style={{ width: "92%" }} />
        <span className={line} style={{ width: "97%" }} />
        <span className={line} style={{ width: "60%" }} />
      </div>

      <div className={cx(zone, zoneSignature)}>
        <svg viewBox="0 0 160 50" width="80%" height="40">
          <path
            className={signaturePath}
            d="M6 34 C 22 6, 34 6, 38 30 C 41 46, 52 12, 66 26 C 78 38, 86 8, 104 24 C 120 38, 132 18, 154 22"
          />
        </svg>
        <span className={cx(tag, tagAccent)}>Signature</span>
      </div>

      <div className={cx(zone, zoneFooter)}>
        <span className={line} style={{ width: "30%" }} />
        <span className={line} style={{ width: "18%" }} />
        <span className={tag}>Footer</span>
      </div>
    </div>
  );
}

const page = css`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;

/* ---- Header ---------------------------------------------------------- */
const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: ${theme.space[5]};
`;

const brand = css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.space[3]};
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  /* usable as a reset-to-home button */
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
`;

const seal = css`
  width: 11px;
  height: 11px;
  border-radius: ${theme.radius.full};
  background-color: ${theme.color.accent};
  box-shadow: 0 0 0 4px ${theme.color.accentSoft};
`;

const headerNav = css`
  display: flex;
  align-items: center;
  gap: ${theme.space[2]};
`;

/* ---- Hero ------------------------------------------------------------ */
const hero = css`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: ${theme.space[16]};
  align-items: center;
  padding-top: ${theme.space[16]};
  padding-bottom: ${theme.space[20]};

  @media screen and (max-width: 920px) {
    grid-template-columns: 1fr;
    gap: ${theme.space[12]};
    padding-top: ${theme.space[10]};
  }
`;

const eyebrow = css`
  margin-bottom: ${theme.space[5]};
`;

const title = css`
  font-size: clamp(2.5rem, 6vw, 4rem);
  line-height: ${theme.lineHeight.tight};
  letter-spacing: ${theme.letterSpacing.tight};
  margin: 0;
`;

const titleAccent = css`
  font-style: italic;
  color: ${theme.color.accent};
`;

const lede = css`
  margin-top: ${theme.space[6]};
  font-size: ${theme.fontSize.lg};
  line-height: ${theme.lineHeight.relaxed};
  color: ${theme.color.inkMuted};
  max-width: 52ch;
`;

/* ---- Hero media column: document mockup stacked above the upload ----- */
const heroMedia = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[8]};
  align-items: stretch;
`;

/* ---- Document mockup (decorative) ------------------------------------ */
const mockupFrame = css`
  position: relative;
  align-self: center;
`;

const sheet = css`
  width: min(360px, 100%);
  aspect-ratio: 1 / 1.32;
  background-color: ${theme.color.surface};
  border-radius: ${theme.radius.md};
  border: 1px solid ${theme.color.line};
  box-shadow: ${theme.shadow.lg};
  padding: ${theme.space[6]};
  display: flex;
  flex-direction: column;
  gap: ${theme.space[4]};
  transform: rotate(-1.5deg);
`;

const zone = css`
  position: relative;
  border-radius: ${theme.radius.sm};
  padding: ${theme.space[3]};
`;

const zoneLetterhead = css`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  border: 1px solid ${theme.color.line};
`;

const zoneBody = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
  padding-block: ${theme.space[2]};
`;

const zoneSignature = css`
  border: 1.5px solid ${theme.color.accent};
  background-color: ${theme.color.accentSoft};
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const zoneFooter = css`
  border-top: 1px solid ${theme.color.line};
  padding-top: ${theme.space[3]};
  display: flex;
  justify-content: space-between;
`;

const tag = css`
  position: absolute;
  top: ${theme.space[2]};
  right: ${theme.space[2]};
  font-family: ${theme.font.mono};
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: ${theme.letterSpacing.wide};
  color: ${theme.color.inkSubtle};
`;

const tagAccent = css`
  color: ${theme.color.accent};
`;

const line = css`
  height: 7px;
  border-radius: ${theme.radius.full};
  background-color: ${theme.color.surfaceSunken};
`;

const sealMark = css`
  width: 28px;
  height: 28px;
  border-radius: ${theme.radius.full};
  background-color: ${theme.color.accent};
  flex-shrink: 0;
`;

const signaturePath = css`
  @keyframes signatureDraw {
    0% {
      stroke-dashoffset: 240;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  fill: none;
  stroke: ${theme.color.accent};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 240;
  animation: signatureDraw 2.4s ${theme.ease.emphasized} 0.6s both;
`;

/* ---- Dropzone (idle focal action) ------------------------------------ */
const rejectionStyle = css`
  margin-top: ${theme.space[4]};
  text-align: center;
  color: ${theme.color.danger};
  font-size: ${theme.fontSize.sm};
`;

const rejectionAction = css`
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${theme.color.accent};
  font-size: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
`;

/* ---- Region cards ---------------------------------------------------- */
const regions = css`
  padding-bottom: ${theme.space[24]};
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.space[5]};

  @media screen and (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const regionCard = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[4]};
`;

const regionHead = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const regionName = css`
  font-family: ${theme.font.display};
  font-size: ${theme.fontSize.xl};
  margin: 0;
`;

const regionDesc = css`
  color: ${theme.color.inkMuted};
  font-size: ${theme.fontSize.sm};
  line-height: ${theme.lineHeight.normal};
  margin: 0;
`;

/* ---- Footer ---------------------------------------------------------- */
const footer = css`
  margin-top: auto;
  border-top: 1px solid ${theme.color.line};
  padding-block: ${theme.space[6]};
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.space[3]};
  color: ${theme.color.inkSubtle};
  font-family: ${theme.font.mono};
  font-size: ${theme.fontSize.xs};
`;
