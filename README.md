# Contact Sheet

**A responsive image builder that runs entirely in your browser.**

Drop in up to 5 images, and Contact Sheet resizes each one to a full set of
responsive breakpoints, re-encodes them to WebP and their original format,
and generates the matching `<picture>` HTML — ready to paste into a site or
theme. No backend, no upload endpoint, no image ever leaves your device.

---

## What it does

- **Batch processing** — load up to 5 images (PNG, JPG, or WebP) at once
- **Responsive variants** — generates every configured width (default: `320`
  → `1920px`) for each image, skipping any width larger than the source so
  nothing gets upscaled
- **Modern formats** — outputs both WebP and the image's original format at
  each width, so you get a real `srcset`, not just one resized file
- **Ready-to-use markup** — builds a `<picture>` tag per image with correct
  `srcset`, `sizes`, `width`/`height`, `loading`, and `decoding` attributes
- **Configurable on the fly** — adjust widths, JPEG/WebP quality, and the
  path prefix baked into the generated URLs, right from the UI
- **One-click export** — download a single image's variants + HTML as a
  `.zip`, or grab everything as one bundle
- **100% client-side** — every resize and re-encode happens on an in-memory
  `<canvas>` in the visitor's own browser

## Why no server?

The whole point of this tool is that it's just a static front end. There's
nothing to host beyond the app itself, nothing to pay for per image
processed, and no privacy concern about where uploaded images go — because
they never go anywhere. That also means it deploys anywhere that can serve a
Next.js app, Vercel included, with zero configuration.

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [JSZip](https://stuk.github.io/jszip/) for client-side `.zip` bundling
- The browser's native [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) for resizing and re-encoding — no WASM, no image library dependency

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop in some images.

## Deploying

This is a standard Next.js app, so Vercel auto-detects everything:

1. Push this repo to GitHub
2. Import it at [vercel.com](https://vercel.com) → **Add New → Project**
3. Leave the default build settings (`npm run build`) and click **Deploy**

No environment variables are required.

## Project structure

```
app/
  layout.tsx          Root layout, loads fonts, sets global metadata
  page.tsx             Main page: upload, settings, processing, results
  globals.css          Tailwind base + the film-strip/darkroom styling
components/
  Dropzone.tsx          Drag-and-drop upload zone (caps at 5 files)
  PreviewThumb.tsx      Thumbnail shown for a queued, not-yet-processed image
  ResultCard.tsx        Per-image results: stats, generated HTML, downloads
lib/
  imageProcessor.ts     Core logic — resize + re-encode via canvas, builds the <picture> HTML
  zip.ts                Bundles all processed variants into a downloadable .zip
```

## Configuration

Default settings live in `DEFAULT_CONFIG` inside `lib/imageProcessor.ts`:

```ts
{
  widths: [320, 420, 640, 768, 992, 1200, 1400, 1600, 1920],
  jpegQuality: 0.82,
  webpQuality: 0.78,
  sizes: "100vw",
  loading: "lazy",
  decoding: "async",
  themePath: "/assets/images",
}
```

These can also be overridden per session from the "Show build settings" panel
in the UI — widths, quality, and the path prefix used in the generated
`srcset` URLs.

## Known limitation

AVIF output isn't included. Browsers don't yet support native AVIF *encoding*
via the Canvas API, so producing it client-side would require bundling a WASM
codec. WebP + the original format are generated instead, which covers the
large majority of real-world `<picture>` usage. See the note in
`lib/imageProcessor.ts` if you want to add AVIF support later.

## License

MIT — use it, fork it, ship it.
