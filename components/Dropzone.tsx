"use client";

import { useCallback, useRef, useState } from "react";

const MAX_FILES = 5;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

interface DropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export default function Dropzone({ files, onFilesChange, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const incomingArr = Array.from(incoming).filter((f) => ACCEPTED.includes(f.type));

      if (incomingArr.length === 0) {
        setError("Only PNG, JPG, or WebP files are accepted.");
        return;
      }

      const combined = [...files, ...incomingArr];
      if (combined.length > MAX_FILES) {
        setError(`Max ${MAX_FILES} frames per roll — loading the first ${MAX_FILES}.`);
      }
      onFilesChange(combined.slice(0, MAX_FILES));
    },
    [files, onFilesChange]
  );

  const atLimit = files.length >= MAX_FILES;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !atLimit) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled || atLimit) return;
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !atLimit && inputRef.current?.click()}
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          disabled || atLimit
            ? "cursor-not-allowed border-base-border/60 opacity-60"
            : isDragging
            ? "cursor-pointer border-safelight bg-safelight/5"
            : "cursor-pointer border-base-border hover:border-safelight/60"
        }`}
      >
        <div className="sprockets h-4" aria-hidden />
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-safelight">
            {atLimit ? "Roll full" : "Load frames"}
          </span>
          <p className="max-w-sm text-paper/90">
            {atLimit
              ? `${MAX_FILES} of ${MAX_FILES} images loaded. Remove one below to swap it out.`
              : "Drag up to 5 images here, or click to browse"}
          </p>
          <p className="font-mono text-xs text-paper-muted">PNG · JPG · WEBP</p>
        </div>
        <div className="sprockets h-4" aria-hidden />
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-xs text-paper-muted">
        <span>
          {files.length} / {MAX_FILES} frames
        </span>
        {error && <span className="text-safelight">{error}</span>}
      </div>
    </div>
  );
}
