"use client";

import { motion } from "framer-motion";
import { Container } from "../components/ui/Container";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import * as s from "./page.css";

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

export default function Home() {
  return (
    <div className={s.page}>
      <Container as="header" className={s.header}>
        <span className={s.brand}>
          <span className={s.seal} aria-hidden />
          Region Extractor
        </span>
        <nav className={s.headerNav}>
          <Button variant="ghost" size="sm">
            Sample
          </Button>
          <Button variant="secondary" size="sm">
            View source
          </Button>
        </nav>
      </Container>

      <Container>
        <motion.section
          className={s.hero}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <div>
            <motion.div variants={reveal} className={s.eyebrow}>
              <Badge tone="outline">PDF → PNG / JPEG</Badge>
            </motion.div>
            <motion.h1 variants={reveal} className={s.title}>
              Extract the signature, letterhead &amp; footer from any{" "}
              <span className={s.titleAccent}>document</span>.
            </motion.h1>
            <motion.p variants={reveal} className={s.lede}>
              Upload a PDF and pull each region out as a clean, downloadable
              image — no manual cropping. Built with transparent heuristics, not
              a black box.
            </motion.p>
            <motion.div variants={reveal} className={s.actions}>
              <Button size="lg">Upload a PDF</Button>
              <Button variant="secondary" size="lg">
                Try a sample
              </Button>
            </motion.div>
          </div>

          <motion.div variants={reveal} className={s.mockupFrame}>
            <DocumentMockup />
          </motion.div>
        </motion.section>

        <motion.section
          className={s.regions}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {REGIONS.map((region) => (
            <motion.div key={region.name} variants={reveal}>
              <Card interactive className={s.regionCard}>
                <div className={s.regionHead}>
                  <h2 className={s.regionName}>{region.name}</h2>
                  <Badge tone={region.tone}>{region.name}</Badge>
                </div>
                <p className={s.regionDesc}>{region.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </Container>

      <Container as="footer" className={s.footer}>
        <span>Built for the OurFirm engineering assessment</span>
        <span>Heuristics-first · TypeScript</span>
      </Container>
    </div>
  );
}

/** Decorative stylized document illustrating the three extractable regions. */
function DocumentMockup() {
  return (
    <div className={s.sheet} aria-hidden>
      <div className={`${s.zone} ${s.zoneLetterhead}`}>
        <span className={s.sealMark} />
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <span className={s.line} style={{ width: "70%" }} />
          <span className={s.line} style={{ width: "45%" }} />
        </div>
        <span className={s.tag}>Letterhead</span>
      </div>

      <div className={s.zoneBody}>
        <span className={s.line} style={{ width: "100%" }} />
        <span className={s.line} style={{ width: "92%" }} />
        <span className={s.line} style={{ width: "97%" }} />
        <span className={s.line} style={{ width: "60%" }} />
      </div>

      <div className={`${s.zone} ${s.zoneSignature}`}>
        <svg viewBox="0 0 160 50" width="80%" height="40">
          <path
            className={s.signaturePath}
            d="M6 34 C 22 6, 34 6, 38 30 C 41 46, 52 12, 66 26 C 78 38, 86 8, 104 24 C 120 38, 132 18, 154 22"
          />
        </svg>
        <span className={`${s.tag} ${s.tagAccent}`}>Signature</span>
      </div>

      <div className={`${s.zone} ${s.zoneFooter}`}>
        <span className={s.line} style={{ width: "30%" }} />
        <span className={s.line} style={{ width: "18%" }} />
        <span className={s.tag}>Footer</span>
      </div>
    </div>
  );
}
