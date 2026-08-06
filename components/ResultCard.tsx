"use client";

import { useState } from "react";
import type { ProcessedImage } from "@/lib/imageProcessor";
import { formatBytes } from "@/lib/imageProcessor";
import { downloadBlob } from "@/lib/zip";
import JSZip from "jszip";

interface ResultCardProps {
  image: ProcessedImage;
  index: number;
}

export default function ResultCard({ image, index }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const reduction = Math.round((1 - image.processedBytes / image.originalBytes) * 100);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(image.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadImage = async () => {
    const zip = new JSZip();
    const folder = zip.folder(image.baseName)!;
    for (const v of image.variants) folder.file(v.filename, v.blob);
    folder.file(`${image.baseName}.html`, image.html);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${image.baseName}.zip`);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-base-border bg-base-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-md bg-base sm:w-40">
          <div className="absolute left-2 top-2 z-10 rounded bg-base/80 px-1.5 py-0.5 font-mono text-[10px] text-safelight">
            {String(index + 1).padStart(2, "0")}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.previewUrl} alt={image.originalName} className="h-full w-full object-cover" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg text-paper">{image.originalName}</h3>
            <span className="font-mono text-xs text-paper-muted">
              {image.originalWidth}×{image.originalHeight}px
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs">
            <span className="text-paper-muted">
              {formatBytes(image.originalBytes)} <span className="mx-1 text-base-border">→</span>{" "}
              <span className="text-develop">{formatBytes(image.processedBytes)} total</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 ${reduction > 0 ? "bg-develop/15 text-develop" : "bg-base-border text-paper-muted"}`}>
              {reduction > 0 ? `-${reduction}%` : "variants only"}
            </span>
            <span className="text-paper-muted">{image.variants.length} files generated</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleDownloadImage}
              className="rounded-md border border-safelight/40 bg-safelight/10 px-3 py-1.5 font-mono text-xs text-safelight transition-colors hover:bg-safelight/20"
            >
              Download frame (.zip)
            </button>
            <button
              onClick={handleCopy}
              className="rounded-md border border-base-border px-3 py-1.5 font-mono text-xs text-paper-muted transition-colors hover:border-paper-muted hover:text-paper"
            >
              {copied ? "Copied ✓" : "Copy <picture> HTML"}
            </button>
          </div>
        </div>
      </div>

      <details className="border-t border-base-border">
        <summary className="cursor-pointer px-4 py-2 font-mono text-xs text-paper-muted hover:text-paper">
          View generated HTML
        </summary>
        <pre className="overflow-x-auto bg-base p-4 font-mono text-xs leading-relaxed text-paper/90">
          <code>{image.html}</code>
        </pre>
      </details>
    </div>
  );
}
