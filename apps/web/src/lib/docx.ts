import { baseName } from "./download";

export function isDocxFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/**
 * Render a .docx to a page image in the browser (docx-preview → canvas), so it
 * can be processed by the same image pipeline as a PDF/photo. Fidelity is
 * best-effort — docx has no fixed page geometry — but it keeps the server free
 * of any Office/LibreOffice dependency.
 */
export async function docxToImageFile(file: File): Promise<File> {
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "816px", // ~8.5in @ 96dpi
    background: "#ffffff",
  });
  document.body.appendChild(container);

  // Loaded on demand (browser-only libs) — keeps them off the server/SSR path
  // and out of the main bundle.
  const [{ renderAsync }, html2canvas] = await Promise.all([
    import("docx-preview"),
    import("html2canvas").then((m) => m.default),
  ]);

  try {
    await renderAsync(file, container, undefined, {
      className: "docx-render",
      inWrapper: true,
      breakPages: true,
    });
    // Let embedded images / fonts settle before snapshotting.
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not render the document"))),
        "image/png",
      ),
    );

    return new File([blob], `${baseName(file.name)}.png`, { type: "image/png" });
  } finally {
    container.remove();
  }
}
