import type { PagePreview } from "@ourfirm/shared";

/** The full document stitched into a single image, in both formats. */
export interface FullDocumentImages {
  png: string;
  jpeg: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load page image"));
    img.src = src;
  });
}

/**
 * Stack the server-rendered page previews vertically onto one canvas and encode
 * the result as PNG + JPEG data URLs — a single-image view of the whole
 * document. Runs in the browser (data URLs are same-origin, so the canvas is
 * never tainted).
 */
export async function buildFullDocumentImages(
  previews: PagePreview[],
): Promise<FullDocumentImages> {
  const GAP = 16;
  const images = await Promise.all(previews.map((p) => loadImage(p.image)));

  const width = Math.max(...images.map((img) => img.naturalWidth));
  const height =
    images.reduce((sum, img) => sum + img.naturalHeight, 0) +
    GAP * Math.max(0, images.length - 1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let y = 0;
  for (const img of images) {
    ctx.drawImage(img, (width - img.naturalWidth) / 2, y);
    y += img.naturalHeight + GAP;
  }

  return {
    png: canvas.toDataURL("image/png"),
    jpeg: canvas.toDataURL("image/jpeg", 0.9),
  };
}
