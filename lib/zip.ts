import JSZip from "jszip";
import type { ProcessedImage } from "./imageProcessor";

/**
 * Bundles every processed image's variants + generated HTML into a single
 * .zip, built entirely in the browser. Nothing is ever sent to a server.
 */
export async function buildZip(images: ProcessedImage[]): Promise<Blob> {
  const zip = new JSZip();

  for (const image of images) {
    const folder = zip.folder(image.baseName);
    if (!folder) continue;
    for (const variant of image.variants) {
      folder.file(variant.filename, variant.blob);
    }
    folder.file(`${image.baseName}.html`, image.html);
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
