"use client";

import { useEffect, useState } from "react";

interface PreviewThumbProps {
  file: File;
  index: number;
  progress?: number; // 0-100 while processing, undefined when idle
  onRemove: () => void;
  disabled?: boolean;
}

export default function PreviewThumb({ file, index, progress, onRemove, disabled }: PreviewThumbProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-md border border-base-border bg-base-card">
      <div className="absolute left-2 top-2 z-10 rounded bg-base/80 px-1.5 py-0.5 font-mono text-[10px] text-safelight">
        {String(index + 1).padStart(2, "0")}
      </div>

      {!disabled && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-base/80 text-paper-muted opacity-0 transition-opacity hover:text-safelight group-hover:opacity-100"
        >
          ×
        </button>
      )}

      <div className="aspect-square w-full overflow-hidden bg-base">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} className="h-full w-full object-cover" />
        )}
      </div>

      {progress !== undefined && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-base-border">
          <div
            className="h-full bg-safelight transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="truncate px-2 py-1.5 font-mono text-[11px] text-paper-muted">{file.name}</div>
    </div>
  );
}
