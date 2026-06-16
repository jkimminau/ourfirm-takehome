/**
 * Generates the sample documents used by the in-app "Try a sample" gallery and
 * for manual testing. Run with: `npm run samples`.
 *
 * Produces, in apps/web/public/samples/:
 *   signed-letter.pdf      valid · letterhead + hand-signed close + footer
 *   project-memo.pdf       valid · letterhead + footer, NO signature (shows the
 *                                  "not detected" state)
 *   service-agreement.pdf  valid · 3 pages, signature on the final page
 *   corrupt.pdf            error · looks like a PDF but the body is malformed
 *   not-a-pdf.pdf          error · plain text disguised with a .pdf extension
 */
import PDFDocument from "pdfkit";
import { createWriteStream, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "apps",
  "web",
  "public",
  "samples",
);
mkdirSync(OUT, { recursive: true });

const INK = "#1b1b18";
const MUTED = "#6b6b62";
const ACCENT = "#c75b39";
const INK_BLUE = "#1c2e52"; // pen ink for signatures
const W = 612;
const H = 792;
const M = 64;
const CONTENT_W = W - M * 2;

function newDoc() {
  return new PDFDocument({ size: "LETTER", margin: M, autoFirstPage: true });
}

function letterhead(doc, { company, tagline, contact }) {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text(company, M, 54);
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(tagline, M, 84);
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .text(contact, M, 56, { width: CONTENT_W, align: "right" });
  doc
    .moveTo(M, 106)
    .lineTo(W - M, 106)
    .lineWidth(2)
    .strokeColor(ACCENT)
    .stroke();
}

function footer(doc, text, pageNo, pageTotal) {
  // Drawing in the bottom margin would make pdfkit auto-add a page; suspend the
  // bottom margin while we place the footer, then restore it.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = H - 58;
  doc
    .moveTo(M, y)
    .lineTo(W - M, y)
    .lineWidth(0.5)
    .strokeColor("#cdcabf")
    .stroke();
  doc.font("Helvetica").fontSize(8).fillColor(MUTED);
  doc.text(text, M, y + 8, { width: CONTENT_W * 0.72, lineGap: 1, lineBreak: true });
  if (pageNo) {
    doc.text(`Page ${pageNo} of ${pageTotal}`, M, y + 8, {
      width: CONTENT_W,
      align: "right",
      lineBreak: false,
    });
  }
  doc.page.margins.bottom = savedBottom;
}

/** A loose, irregular ink squiggle — visually a hand signature. */
function signature(doc, x, y) {
  doc.save();
  doc.lineWidth(1.6).strokeColor(INK_BLUE).lineCap("round").lineJoin("round");
  doc
    .moveTo(x, y)
    .bezierCurveTo(x + 18, y - 30, x + 33, y - 26, x + 40, y + 4)
    .bezierCurveTo(x + 46, y + 26, x + 64, y - 20, x + 80, y + 6)
    .bezierCurveTo(x + 95, y + 26, x + 110, y - 16, x + 138, y - 4)
    .bezierCurveTo(x + 150, y + 2, x + 150, y + 2, x + 168, y - 8)
    .stroke();
  doc.restore();
}

function paragraphs(doc, startY, paras, size = 11) {
  doc.font("Helvetica").fontSize(size).fillColor(INK);
  let y = startY;
  for (const p of paras) {
    doc.text(p, M, y, { width: CONTENT_W, align: "left", lineGap: 3.5 });
    y = doc.y + 12;
  }
  return y;
}

function write(doc, name) {
  return new Promise((resolve) => {
    const path = join(OUT, name);
    const stream = createWriteStream(path);
    stream.on("finish", () => resolve(name));
    doc.pipe(stream);
    doc.end();
  });
}

// --- signed-letter.pdf -----------------------------------------------------
async function signedLetter() {
  const doc = newDoc();
  letterhead(doc, {
    company: "Northwind Stationers",
    tagline: "Fine paper & correspondence since 1962",
    contact: "118 Harbor Row\nPortland, ME 04101\n(207) 555-0142",
  });

  doc.font("Helvetica").fontSize(11).fillColor(MUTED).text("April 12, 2026", M, 132);
  doc
    .fillColor(INK)
    .text("Ms. Adeline Cross\nCross & Meridian Architects\n44 Beacon Street\nBoston, MA 02108", M, 156);

  let y = paragraphs(doc, 232, [
    "Dear Ms. Cross,",
    "Thank you for selecting Northwind Stationers to produce the letterhead and correspondence cards for your new studio. We are delighted to begin work on the project and have reserved press time for the first run later this month.",
    "Enclosed you will find proofs for the primary letterhead, the second sheet, and the matching envelopes. Once you have approved the proofs, we will move directly to production and expect to deliver within ten business days.",
    "It is a pleasure to work with your team, and we look forward to a long association.",
  ]);

  doc.font("Helvetica").fontSize(11).fillColor(INK).text("Sincerely,", M, y + 6);
  signature(doc, M, y + 64);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(INK)
    .text("Eleanor Whitfield", M, y + 84);
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("Managing Director", M, y + 100);

  footer(
    doc,
    "Northwind Stationers · This letter and any enclosures are confidential and intended only for the named recipient.",
  );
  return write(doc, "signed-letter.pdf");
}

// --- project-memo.pdf (no signature) --------------------------------------
async function projectMemo() {
  const doc = newDoc();
  letterhead(doc, {
    company: "Northwind Stationers",
    tagline: "Internal Memorandum",
    contact: "Operations\nMill Floor 2",
  });

  doc.font("Helvetica").fontSize(10).fillColor(INK);
  const meta = [
    ["TO", "Production & Bindery teams"],
    ["FROM", "Operations Planning"],
    ["DATE", "April 9, 2026"],
    ["RE", "Spring press schedule and maintenance window"],
  ];
  let y = 132;
  for (const [k, v] of meta) {
    doc.font("Helvetica-Bold").text(k, M, y, { width: 60, continued: false });
    doc.font("Helvetica").text(v, M + 70, y, { width: CONTENT_W - 70 });
    y += 18;
  }

  paragraphs(doc, y + 14, [
    "Please note the updated press schedule for the spring run. Press time is reserved Monday through Thursday next week, with the bindery operating on the standard two-shift pattern.",
    "The annual maintenance window for the No. 3 press is confirmed for the following Friday. Plan finishing work around that closure and route rush jobs to the No. 1 press.",
  ]);

  // Deliberately no signature and no footer — the lower half of the page is
  // blank, so this document exercises the "region not detected" path for both.
  return write(doc, "project-memo.pdf");
}

// --- service-agreement.pdf (3 pages, signature on the last) ---------------
async function serviceAgreement() {
  const doc = newDoc();
  const TOTAL = 3;

  // Page 1
  letterhead(doc, {
    company: "Northwind Stationers",
    tagline: "Service Agreement",
    contact: "Contracts Office\n118 Harbor Row",
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(INK)
    .text("PRINTING SERVICES AGREEMENT", M, 132, { width: CONTENT_W, align: "center" });
  paragraphs(doc, 170, [
    "This Printing Services Agreement (the “Agreement”) is entered into as of April 1, 2026, between Northwind Stationers (the “Provider”) and the undersigned client (the “Client”).",
    "1. Scope of Work. The Provider shall furnish design, proofing, and printing services as described in each accepted order. Each order incorporates the terms of this Agreement by reference.",
    "2. Proofs and Approval. The Client shall review and approve all proofs prior to production. The Provider is not responsible for errors present in Client-approved proofs.",
    "3. Schedule. The Provider shall use commercially reasonable efforts to meet agreed delivery dates. Delivery estimates are not guarantees and may be affected by material availability.",
  ]);
  footer(doc, "Printing Services Agreement", 1, TOTAL);

  // Page 2
  doc.addPage();
  paragraphs(doc, 80, [
    "4. Fees and Payment. The Client shall pay the amounts stated in each accepted order. Invoices are due within thirty (30) days of the invoice date. Late amounts may accrue interest at 1.5% per month.",
    "5. Materials. Title to materials passes to the Client upon full payment. The Provider retains custody of press-ready files for archival purposes only.",
    "6. Confidentiality. Each party shall protect the other’s confidential information and use it solely to perform under this Agreement.",
    "7. Limitation of Liability. The Provider’s aggregate liability shall not exceed the amounts paid for the order giving rise to the claim. Neither party is liable for indirect or consequential damages.",
    "8. Term and Termination. Either party may terminate for material breach on thirty (30) days’ written notice if the breach remains uncured.",
  ]);
  footer(doc, "Printing Services Agreement", 2, TOTAL);

  // Page 3 — execution + signature
  doc.addPage();
  let y = paragraphs(doc, 80, [
    "9. Governing Law. This Agreement is governed by the laws of the State of Maine, without regard to its conflict-of-laws principles.",
    "10. Entire Agreement. This Agreement, together with accepted orders, constitutes the entire understanding between the parties and supersedes all prior discussions.",
    "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
  ]);

  y += 24;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("PROVIDER:", M, y);
  signature(doc, M, y + 54);
  doc
    .moveTo(M, y + 66)
    .lineTo(M + 220, y + 66)
    .lineWidth(0.75)
    .strokeColor(MUTED)
    .stroke();
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("Eleanor Whitfield, Managing Director", M, y + 72);
  doc.text("Northwind Stationers", M, y + 86);

  footer(doc, "Printing Services Agreement", 3, TOTAL);
  return write(doc, "service-agreement.pdf");
}

// --- letter-photo.png (image input) ---------------------------------------
// A letter rendered as a flat image (no text layer) — exercises the image
// pipeline. SVG → PNG via sharp so it's reproducible and cross-platform.
async function imageLetter() {
  const line = (x, y, w) =>
    `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#e7e3d6"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <text x="${M}" y="74" font-family="Helvetica, Arial" font-size="24" font-weight="bold" fill="${INK}">Northwind Stationers</text>
    <text x="${M}" y="96" font-family="Helvetica, Arial" font-size="11" fill="${MUTED}">Fine paper &amp; correspondence since 1962</text>
    <rect x="${M}" y="106" width="${CONTENT_W}" height="2" fill="${ACCENT}"/>
    <text x="${M}" y="150" font-family="Helvetica, Arial" font-size="11" fill="${MUTED}">April 12, 2026</text>
    ${[200, 222, 244, 266, 300, 322, 344].map((y, i) => line(M, y, CONTENT_W - (i % 3) * 60)).join("")}
    <text x="${M}" y="430" font-family="Helvetica, Arial" font-size="11" fill="${INK}">Sincerely,</text>
    <path d="M${M} 480 C ${M + 22} 452, ${M + 38} 456, ${M + 46} 486 C ${M + 54} 512, ${M + 76} 466, ${M + 96} 492 C ${M + 114} 512, ${M + 132} 470, ${M + 168} 480"
      fill="none" stroke="${INK_BLUE}" stroke-width="2.2" stroke-linecap="round"/>
    <text x="${M}" y="520" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="${INK}">Eleanor Whitfield</text>
    <rect x="${M}" y="${H - 64}" width="${CONTENT_W}" height="1" fill="#cdcabf"/>
    <text x="${M}" y="${H - 44}" font-family="Helvetica, Arial" font-size="8" fill="${MUTED}">Northwind Stationers · Confidential — intended only for the named recipient.</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, "letter-photo.png"));
  return "letter-photo.png";
}

// --- letter.docx (Word input) ---------------------------------------------
async function wordLetter() {
  const p = (text, opts = {}) =>
    new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 }, ...opts.para });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Northwind Stationers", bold: true, size: 40 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Fine paper & correspondence since 1962", color: "6b6b62", size: 20 })],
            spacing: { after: 320 },
          }),
          p("April 12, 2026"),
          p("Dear Ms. Cross,"),
          p("Thank you for selecting Northwind Stationers to produce the letterhead and correspondence cards for your new studio. We have reserved press time for the first run later this month."),
          p("Enclosed you will find proofs for the primary letterhead and the matching envelopes. Once approved, we will move directly to production."),
          p("Sincerely,", { para: { spacing: { before: 240, after: 480 } } }),
          new Paragraph({ children: [new TextRun({ text: "Eleanor Whitfield", bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: "Managing Director", color: "6b6b62" })] }),
        ],
      },
    ],
  });
  writeFileSync(join(OUT, "letter.docx"), await Packer.toBuffer(doc));
  return "letter.docx";
}

// --- error inputs ----------------------------------------------------------
function errorInputs() {
  writeFileSync(
    join(OUT, "corrupt.pdf"),
    "%PDF-1.4\nThis file begins like a PDF but the body is deliberately malformed " +
      "so it cannot be parsed or rendered. It exercises the corrupt-document guard.\n%%EOF",
  );
  writeFileSync(
    join(OUT, "not-a-pdf.pdf"),
    "This is a plain text file pretending to be a PDF by its extension. The server " +
      "rejects it after inspecting the magic bytes, not the file name.",
  );
}

const made = await Promise.all([
  signedLetter(),
  projectMemo(),
  serviceAgreement(),
  imageLetter(),
  wordLetter(),
]);
errorInputs();
made.push("corrupt.pdf", "not-a-pdf.pdf");
console.log("Generated samples:\n" + made.map((n) => "  - " + n).join("\n"));
