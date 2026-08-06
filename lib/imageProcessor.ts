// Client-side port of the original image-builder.js.
// Everything here runs in the browser — no server, no upload, no API route.
// Resizing + re-encoding happens on an in-memory <canvas>, mirroring the
// original sharp pipeline: N widths x {webp, original-format} + a
// generated <picture> HTML snippet per image.

export interface BuildConfig {
  widths: number[];
  jpegQuality: number; // 0–1 (canvas scale, not 0–100 like sharp)
  webpQuality: number; // 0–1
  sizes: string;
  loading: "lazy" | "eager";
  decoding: "async" | "sync" | "auto";
  themePath: string; // prefix baked into the generated srcset URLs
}

export const DEFAULT_CONFIG: BuildConfig = {
  widths: [320, 420, 640, 768, 992, 1200, 1400, 1600, 1920],
  jpegQuality: 0.82,
  webpQuality: 0.78,
  sizes: "100vw",
  loading: "lazy",
  decoding: "async",
  themePath: "/assets/images",
};

export interface Variant {
  width: number;
  kind: "webp" | "original";
  filename: string;
  blob: Blob;
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  baseName: string;
  ext: "png" | "jpg" | "webp";
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  processedBytes: number;
  variants: Variant[];
  html: string;
  previewUrl: string;
}

function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error(`Could not decode ${file.name}`));
    img.src = url;
  });
}

function drawResized(img: HTMLImageElement, targetWidth: number): HTMLCanvasElement {
  const scale = targetWidth / img.naturalWidth;
  const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Encoding to ${type} failed`))),
      type,
      quality
    );
  });
}

function extOf(filename: string): "png" | "jpg" | "webp" {
  const raw = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  if (raw === "jpeg") return "jpg";
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  return "jpg"; // sensible fallback for anything unrecognized
}

function baseNameOf(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/**
 * Process a single image: generate every configured responsive width in
 * both WebP and its original format, then build the matching <picture> tag.
 */
export async function processImage(
  file: File,
  config: BuildConfig = DEFAULT_CONFIG,
  onStep?: (doneSteps: number, totalSteps: number) => void
): Promise<ProcessedImage> {
  const { img, url } = await loadImage(file);
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;
  const ext = extOf(file.name);
  const baseName = baseNameOf(file.name);
  const originalMime = ext === "png" ? "image/png" : "image/jpeg";

  // Mirror image-builder.js: always include the original width, sort, and
  // only keep widths that don't upscale the source image.
  const widths = Array.from(new Set([...config.widths, originalWidth]))
    .filter((w) => w <= originalWidth)
    .sort((a, b) => a - b);

  const variants: Variant[] = [];
  const webpSrcset: string[] = [];
  const originalSrcset: string[] = [];

  const totalSteps = widths.length * 2;
  let step = 0;

  for (const targetWidth of widths) {
    const canvas = drawResized(img, targetWidth);

    // ---- WebP ----
    const webpBlob = await toBlob(canvas, "image/webp", config.webpQuality);
    const webpFilename = `${baseName}-${targetWidth}.webp`;
    variants.push({ width: targetWidth, kind: "webp", filename: webpFilename, blob: webpBlob });
    webpSrcset.push(`${config.themePath}/${webpFilename} ${targetWidth}w`);
    step++;
    onStep?.(step, totalSteps);

    // ---- Original format (png stays lossless, jpg uses jpegQuality) ----
    const quality = originalMime === "image/jpeg" ? config.jpegQuality : undefined;
    const originalBlob = await toBlob(canvas, originalMime, quality);
    const originalFilename = `${baseName}-${targetWidth}.${ext}`;
    variants.push({ width: targetWidth, kind: "original", filename: originalFilename, blob: originalBlob });
    originalSrcset.push(`${config.themePath}/${originalFilename} ${targetWidth}w`);
    step++;
    onStep?.(step, totalSteps);
  }

  const largestWidth = Math.max(...widths);
  const fallbackFilename = `${baseName}-${largestWidth}.${ext}`;

  const html = `<picture>
    <source
        type="image/webp"
        srcset="${webpSrcset.join(",\n        ")}">

    <img
        src="${config.themePath}/${fallbackFilename}"
        srcset="${originalSrcset.join(",\n        ")}"
        sizes="${config.sizes}"
        width="${originalWidth}"
        height="${originalHeight}"
        loading="${config.loading}"
        decoding="${config.decoding}"
        alt="">
</picture>`;

  const processedBytes = variants.reduce((sum, v) => sum + v.blob.size, 0);

  return {
    id: `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    originalName: file.name,
    baseName,
    ext,
    originalWidth,
    originalHeight,
    originalBytes: file.size,
    processedBytes,
    variants,
    html,
    previewUrl: url,
  };
}

export async function processBatch(
  files: File[],
  config: BuildConfig = DEFAULT_CONFIG,
  onImageProgress?: (index: number, pct: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = await processImage(files[i], config, (done, total) => {
      onImageProgress?.(i, Math.round((done / total) * 100));
    });
    results.push(result);
  }
  return results;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
