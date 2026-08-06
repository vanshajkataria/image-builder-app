"use client";

import { useState } from "react";
import Dropzone from "@/components/Dropzone";
import PreviewThumb from "@/components/PreviewThumb";
import ResultCard from "@/components/ResultCard";
import { processBatch, DEFAULT_CONFIG, type ProcessedImage, type BuildConfig } from "@/lib/imageProcessor";
import { buildZip, downloadBlob } from "@/lib/zip";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [config, setConfig] = useState<BuildConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<number[]>([]);
  const [results, setResults] = useState<ProcessedImage[] | null>(null);
  const [zipping, setZipping] = useState(false);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResults(null);
    setProgress(files.map(() => 0));

    try {
      const processed = await processBatch(files, config, (index, pct) => {
        setProgress((prev) => {
          const next = [...prev];
          next[index] = pct;
          return next;
        });
      });
      setResults(processed);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong while processing.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!results) return;
    setZipping(true);
    try {
      const blob = await buildZip(results);
      downloadBlob(blob, "contact-sheet-output.zip");
    } finally {
      setZipping(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults(null);
    setProgress([]);
  };

  const totalOriginal = results?.reduce((s, r) => s + r.originalBytes, 0) ?? 0;
  const totalProcessed = results?.reduce((s, r) => s + r.processedBytes, 0) ?? 0;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="mt-3 font-display text-4xl font-medium text-paper sm:text-5xl">Web Inspector</h1>
        <p className="mt-3 max-w-xl text-paper-muted">
          Load up to five images, develop them into responsive WebP + original srcsets, and get a ready-to-use{" "}
          <code className="font-mono text-sm text-safelight">&lt;picture&gt;</code> tag for each — all processed
          right on your browser.
        </p>
      </header>

      <Dropzone files={files} onFilesChange={setFiles} disabled={processing} />

      {files.length > 0 && !results && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {files.map((file, i) => (
            <PreviewThumb
              key={`${file.name}-${i}`}
              file={file}
              index={i}
              progress={processing ? progress[i] : undefined}
              onRemove={() => removeFile(i)}
              disabled={processing}
            />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="font-mono text-xs text-paper-muted underline decoration-base-border underline-offset-4 hover:text-paper"
          >
            {settingsOpen ? "Hide" : "Show"} build settings
          </button>

          {settingsOpen && (
            <div className="mt-3 grid gap-4 rounded-lg border border-base-border bg-base-card p-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-paper-muted">Widths (px, comma-separated)</span>
                <input
                  type="text"
                  value={config.widths.join(", ")}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      widths: e.target.value
                        .split(",")
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n) && n > 0),
                    }))
                  }
                  className="rounded-md border border-base-border bg-base px-3 py-1.5 font-mono text-sm text-paper outline-none focus:border-safelight"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-paper-muted">Theme path (srcset prefix)</span>
                <input
                  type="text"
                  value={config.themePath}
                  onChange={(e) => setConfig((c) => ({ ...c, themePath: e.target.value }))}
                  className="rounded-md border border-base-border bg-base px-3 py-1.5 font-mono text-sm text-paper outline-none focus:border-safelight"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-paper-muted">
                  JPEG quality — {Math.round(config.jpegQuality * 100)}
                </span>
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.01}
                  value={config.jpegQuality}
                  onChange={(e) => setConfig((c) => ({ ...c, jpegQuality: parseFloat(e.target.value) }))}
                  className="accent-safelight"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-paper-muted">
                  WebP quality — {Math.round(config.webpQuality * 100)}
                </span>
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.01}
                  value={config.webpQuality}
                  onChange={(e) => setConfig((c) => ({ ...c, webpQuality: parseFloat(e.target.value) }))}
                  className="accent-safelight"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {files.length > 0 && !results && (
        <button
          onClick={handleProcess}
          disabled={processing}
          className="mt-6 w-full rounded-md bg-safelight py-3 font-mono text-sm font-medium text-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Developing…" : `Develop ${files.length} frame${files.length > 1 ? "s" : ""}`}
        </button>
      )}

      {results && (
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-base-border pb-4">
            <div className="font-mono text-xs text-paper-muted">
              {results.length} frames developed · {(totalOriginal / 1024).toFixed(0)} KB →{" "}
              <span className="text-develop">{(totalProcessed / 1024).toFixed(0)} KB</span> across all variants
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="rounded-md border border-base-border px-3 py-1.5 font-mono text-xs text-paper-muted hover:text-paper"
              >
                Start over
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={zipping}
                className="rounded-md bg-safelight px-4 py-1.5 font-mono text-xs font-medium text-base hover:opacity-90 disabled:opacity-50"
              >
                {zipping ? "Zipping…" : "Download all (.zip)"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {results.map((image, i) => (
              <ResultCard key={image.id} image={image} index={i} />
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-base-border pt-6 font-mono text-xs text-paper-muted">
        Every resize and re-encode happens on your device with the Canvas API. No image is ever transmitted anywhere.
      </footer>
    </main>
  );
}
