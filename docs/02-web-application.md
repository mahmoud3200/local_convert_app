# Web application

The web build is a privacy-first converter that runs entirely in the browser. It uses React and `ffmpeg.wasm`, and it never sends media files to a backend.

## Stack

- Vite
- React 19
- Tailwind CSS 4
- shadcn-style primitives built on Radix UI
- `@ffmpeg/ffmpeg` with the bundled WASM core

## Browser requirements

The app checks for the features it actually needs before enabling conversion:

- `WebAssembly`
- `Worker`
- `File`
- `Blob`
- `URL.createObjectURL`

The check lives in `src/platform/check-browser-support.ts`. A browser that passes the check can still hit codec or memory limits during a real conversion.

`ffmpeg.wasm` uses workers and shared memory. The Vite development and preview servers send:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Production hosting must provide equivalent headers.

## Engine behavior

The web engine lives in `src/platform/converter/wasm-engine.ts`.

Supported outputs:

| Media | Formats |
| --- | --- |
| Image | PNG, JPG/JPEG, WebP, GIF, BMP, TIF/TIFF |
| Audio | MP3, WAV, AAC, OGG, FLAC, M4A |
| Video | Original format only |

Why the web runtime is conservative:

- AVIF output is disabled because the bundled WASM core does not include an AV1 encoder.
- Video keeps its original format to avoid unreliable large transcodes.
- AVIF, broader video formats, and advanced video controls are desktop-only.

The advanced settings exposed on the web are:

- image: quality, compression, resolution, metadata removal
- audio: bitrate, sample rate, channels, metadata removal
- video: metadata removal only

## Conversion flow

1. The browser reads the selected `File`.
2. The WASM engine writes the file into FFmpeg's virtual filesystem.
3. FFmpeg builds and runs an argument list from the user-facing settings.
4. The output is read back as a `Blob`.
5. The browser triggers a normal file download.

Conversions run through an internal queue inside `WasmEngine`, so concurrent conversions do not fight over the same FFmpeg instance.

Cancelling the active conversion terminates the FFmpeg worker and resets the engine. The next conversion loads a fresh instance.

## Persistence

The web build persists default conversion settings per media type in `localStorage`:

- `local-convert:defaults:v1`

Queue contents are not persisted. A reload loses selected files because browser `File` objects cannot be reconnected to their original file handles.

## Analytics

See [Analytics](04-analytics.md) for Google Analytics setup, consent behavior, and desktop exclusions.

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

`npm run build` runs TypeScript first, then Vite. The output is written to `dist`.

## Deployment notes

- Deploy `dist` as a static site.
- Keep the COOP/COEP headers when serving the app.
- The web app has no server-side conversion component.
- See [Analytics](04-analytics.md) when configuring optional Google Analytics.

## Troubleshooting

**The page loads but conversion fails immediately**

Check the browser console for WASM loading errors. Missing COOP/COEP headers are a common cause in production.

**Large video conversions are slow or crash the tab**

This is expected on the web runtime. Use the desktop app for large or heavily encoded video.

**AVIF is missing**

AVIF output is intentionally desktop-only.

## Related docs

- [How LoConvert works](01-how-loconvert-works.md)
- [Desktop application](03-desktop-application.md)
- [Analytics](04-analytics.md)
- [Contributing](../CONTRIBUTING.md)
