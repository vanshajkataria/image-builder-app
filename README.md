# Contact Sheet — client-side responsive image builder

A Next.js + Tailwind front end that reproduces your original `image-builder.js`
(sharp) pipeline entirely **in the browser**: pick up to 5 images, it resizes
each to every configured breakpoint, re-encodes to WebP + the original
format, and generates the matching `<picture>` HTML — same as the Node
script, just running on-device with the Canvas API instead of a server.

No upload endpoint, no API route, no image ever leaves the user's machine.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Because there's no backend, this deploys as a static-friendly Next.js app —
Vercel auto-detects everything.

**Dashboard (easiest):**
1. Push this folder to a GitHub repo.
2. Go to vercel.com → **Add New → Project** → import the repo.
3. Framework preset: Next.js (auto-detected). Leave build settings default
   (`npm run build`, output handled automatically).
4. Click **Deploy**. Done — you'll get a `*.vercel.app` URL.

**CLI (faster if you don't want a repo yet):**
```bash
npm i -g vercel
vercel        # first deploy, follow the prompts
vercel --prod # promote to production
```

No environment variables are needed — there's nothing server-side to configure.

## How the compression logic maps to the original script

| `image-builder.js` (sharp, Node) | This app (Canvas, browser) |
|---|---|
| `config.json` widths/quality | `lib/imageProcessor.ts` → `DEFAULT_CONFIG`, editable in the UI's "build settings" panel |
| `sharp(file).resize(...)` | `canvas.drawImage()` onto a sized `<canvas>` |
| `.avif()` / `.webp()` / `.jpeg()` / `.png()` | `canvas.toBlob('image/webp' | 'image/jpeg' | 'image/png', quality)` |
| Loop over widths, write files to `/output` | Loop over widths, keep `Blob`s in memory, zipped client-side with `jszip` |
| Writes `<picture>` to `{filename}.html` | Same template, built as a string per image, shown in an expandable code block + included in the zip |

**One intentional difference: AVIF is not generated.** Real AVIF *encoding*
in a browser needs a WASM codec (there's no native `canvas.toBlob('image/avif')`
support across browsers yet), which adds a fair bit of bundle size and
complexity. The app ships WebP + the original format, which covers the vast
majority of real-world `<picture>` usage. If you want AVIF back, the cleanest
path is adding [`@jsquash/avif`](https://github.com/jamsinclair/jSquash) to
`lib/imageProcessor.ts` and generating a third `<source>` — happy to wire
that in if you want it.

## Notes

- **File cap**: hardcoded to 5 in `components/Dropzone.tsx` (`MAX_FILES`) — change it there if needed.
- **Quality values** are 0–1 floats (Canvas API convention) rather than sharp's 0–100 scale; the defaults (`jpegQuality: 0.82`, `webpQuality: 0.78`) match your original config's *intent*, not identical bytes.
- **`themePath`** is just the string prefix baked into the generated `srcset` URLs (mirrors `config.json`'s `themePath`) — edit it in the UI before processing, or change `DEFAULT_CONFIG` in `lib/imageProcessor.ts`.
- Everything runs synchronously per image in the main thread via `canvas.toBlob`, which is async but not offloaded to a Worker. For 5 images at typical photo resolutions this is fine; if you push much larger batches later, moving the loop into a Web Worker would keep the UI perfectly smooth.
