# Local Convert

Local Convert is a privacy-first local file converter built as a single codebase that runs in two environments:

- Web: React + FFmpeg WASM for lighter, browser-safe work
- Desktop: Tauri v2 + native FFmpeg for broader format support and heavier jobs

The project is intentionally a one-page utility, not a marketing site and not a routed app.
(If i ever needed to do a marketing site i'll do a vanilla html, css, js landing page and route the app and the landing page using NGINX or refactor the repo to into next.js)

Current public release target: `v1.0-beta`

## Note from the developer

This project was built as a learning experience in designing a cross-platform architecture for local media processing.

I used AI tools to accelerate parts of the implementation, especially when working with Tauri and Rust, which I’m still learning. However, the architecture, system design, and product decisions were made intentionally to address real constraints such as browser limitations, performance, and codec support.

The goal was to build a practical, privacy-first tool that clearly separates responsibilities between the UI, feature logic, and platform layer, while keeping the behavior predictable across both web and desktop environments.

## What the project does

- Converts images, audio, and video locally
- Supports multiple files in one queue
- Stores default conversion settings per media type
- Supports per-file configuration
- Uses a shared UI with two different conversion engines
- Persists theme and default settings in `localStorage`
- Persists the desktop queue across app restarts when files still exist
- Uses desktop notifications when a conversion finishes in Tauri

## Why there are two engines

This repo is built around one product with two runtime paths.

### Web engine

The browser build uses `ffmpeg.wasm`. This is useful because it keeps everything local and requires no backend, but it also has real limits:

- browser memory limits
- slower heavy transcoding
- codec support depends on the bundled WASM core
- large previews and large video transcodes can make the UI unstable

Because of that, the web engine is intentionally conservative:

- AVIF is not exposed on the web runtime
- browser video output is limited to `original`
- heavy browser video transcoding is intentionally avoided

### Desktop engine

The desktop build uses Tauri and calls native FFmpeg through Rust. This is the higher-power path:

- broader codec and format support
- better handling for larger files
- native file paths instead of copying everything through JS memory
- platform integrations such as notifications and desktop save dialogs

The React UI does not know which engine is active. It talks to a platform boundary, and the platform picks the correct engine at runtime.

## Core technical decisions

### 1. Shared UI, separate platform layer

The app is split into three layers:

- UI components render the interface and hold small UI-only state
- feature hooks manage queue state, settings state, and conversion orchestration
- platform code handles runtime-specific work such as FFmpeg execution, file system access, output saving, notifications, and sleep prevention

This keeps React code from directly knowing about Tauri commands or FFmpeg internals.

### 2. Capability-driven UI

Each engine exposes an `EngineCapabilities` object:

- runtime label
- supported output formats per media type
- allowed advanced settings per media type
- runtime notes

The UI derives its options from those capabilities instead of hardcoding one global set of behaviors. That is what allows:

- web and desktop to show different valid output formats
- invalid controls to stay hidden for the wrong file type
- browser limitations to be surfaced honestly in the UI

### 3. No raw FFmpeg flags in the UI

The UI only exposes domain-level settings such as:

- output format
- preset
- quality
- resolution
- bitrate
- sample rate
- metadata removal

Raw FFmpeg arguments are intentionally not exposed. The goal is:

- safer validation
- fewer invalid combinations
- easier future maintenance
- a cleaner product for non-technical users

### 4. Browser video is intentionally limited

Browser video conversion is the most expensive and least reliable path in this product. Instead of pretending the browser can do everything equally well, the web runtime is intentionally limited to the safer path:

- keep the original video format on web
- avoid broad browser-side re-encoding options
- direct heavier jobs toward the desktop app

That decision is product-driven and technical:

- less browser memory pressure
- fewer codec-related failures
- more predictable UX

### 5. Preview is capped at 50 MB

Preview is disabled for files larger than `50 MB` in both web and desktop UI.

This limit exists to protect the UI runtime:

- browser previews decode inside the page
- Tauri previews still render inside a WebView
- large media previews can freeze the interface or decode unpredictably

Conversion can still work for larger files. The limit only applies to preview.

### 6. Desktop prefers native file paths

When a file is chosen in the desktop app through the native picker, the app keeps the native path and converts from disk. This avoids routing large files through JS memory and keeps desktop performance reasonable.

There is still a fallback path for browser `File` objects, but that route is intentionally guarded for large files.

### 7. Persistence is scoped and defensive

The app persists:

- theme preference
- default settings per media kind
- desktop queue state for native-path files

Desktop queue restore is defensive:

- missing native paths are filtered out
- invalid settings are sanitized on load
- restored previews are rebuilt safely instead of trusting stale access state

### 8. Cancellation matters

Conversion jobs are designed to be cancellable:

- removing a converting file cancels its job
- clearing the queue cancels active jobs
- closing the desktop app stops running FFmpeg processes

That behavior exists because long-running local media work must not survive UI cleanup unexpectedly.

### 9. Tailwind v4 uses semantic tokens

The UI uses Tailwind v4 with semantic CSS variables in [`src/styles/globals.css`](src/styles/globals.css):

- `@theme` is used for structural tokens such as radii, shadows, spacing, and fonts
- `@theme inline` maps semantic color utilities to CSS variables
- light/dark mode is handled by `data-theme` on the document root

This keeps theme switching simple and keeps component classes tied to semantic meaning instead of hardcoded color values.

## Folder structure

The most important parts of the repo are:

```text
src/
  app/
    App.tsx
    WebsiteAnalytics.tsx
  components/
    ui/
      ...shared UI primitives only
  features/
    converter/
      components/
        dialogs/
        file-list/
        layout/
        settings/
      hooks/
        useFileManager.ts
        useConversionSettings.ts
        useConversionProcess.ts
        useConverterWorkspace.ts
        useThemePreference.ts
        ...
      check-browser-support.ts
      constants.ts
      conversion-request.ts
      desktop-queue-storage.ts
      file-formatting.ts
      format-support.ts
      presets.ts
      preview-rules.ts
      settings-rules.ts
      settings-storage.ts
      settings-summary.ts
      theme-storage.ts
      types.ts
  platform/
    converter/
      create-engine.ts
      engine.ts
      wasm-engine.ts
      tauri-engine.ts
      cancel-all-conversions.ts
    files/
      tauri-file-picker.ts
    notifications/
      conversion-notifications.ts
    output/
      download-output.ts
      tauri-output.ts
      web-output.ts
      zip-output.ts
    power/
      sleep-prevention.ts
    preview/
      media-dimensions.ts
    converter-platform.ts
    create-converter-platform.ts
    tauri-runtime.ts
  styles/
    globals.css

src-tauri/
  src/
    lib.rs
    main.rs
  binaries/
    ...FFmpeg sidecars per target when bundled
  tauri.conf.json

scripts/
  setup-ffmpeg-sidecar.mjs
  setup-ffmpeg-sidecar.ps1

docs/
  desktop-releases.md
  THIRD-PARTY-NOTICES.txt
  ffmpeg-licensing.md
```

## Responsibility by area

### `src/features/converter`

This is the main feature boundary.

- `components/` contains converter-specific UI
- `hooks/` contains feature state and orchestration
- the top-level files define settings, presets, storage, validation, and formatting rules

This folder should contain converter-specific behavior, not general-purpose app code.

### `src/platform`

This is the runtime boundary.

It handles:

- engine selection
- browser vs desktop conversion
- native file picking
- output saving
- ZIP export
- notifications
- preview metadata loading
- sleep prevention

This layer should not know about React rendering.

### `src/components/ui`

This folder is reserved for truly reusable UI primitives such as buttons, selects, dialogs, and tooltips.

Converter-specific UI does not belong here.

### `src-tauri`

This is the desktop backend.

Key jobs handled in Rust:

- native FFmpeg execution
- sidecar/system FFmpeg resolution
- conversion cancellation
- native file metadata access
- preview file reads for restored desktop items
- saving and zipping generated outputs
- app-close cleanup for running FFmpeg jobs

## Important files to understand first

If you are new to the codebase, start here:

1. [`src/app/App.tsx`](src/app/App.tsx)
2. [`src/features/converter/components/layout/ConverterScreen.tsx`](src/features/converter/components/layout/ConverterScreen.tsx)
3. [`src/features/converter/hooks/useConverterWorkspace.ts`](src/features/converter/hooks/useConverterWorkspace.ts)
4. [`src/features/converter/hooks/useFileManager.ts`](src/features/converter/hooks/useFileManager.ts)
5. [`src/features/converter/hooks/useConversionSettings.ts`](src/features/converter/hooks/useConversionSettings.ts)
6. [`src/features/converter/hooks/useConversionProcess.ts`](src/features/converter/hooks/useConversionProcess.ts)
7. [`src/platform/create-converter-platform.ts`](src/platform/create-converter-platform.ts)
8. [`src/platform/converter/create-engine.ts`](src/platform/converter/create-engine.ts)
9. [`src/platform/converter/wasm-engine.ts`](src/platform/converter/wasm-engine.ts)
10. [`src/platform/converter/tauri-engine.ts`](src/platform/converter/tauri-engine.ts)
11. [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs)

## How the app flows

At a high level:

1. `App.tsx` creates the converter platform.
2. `createConverterPlatform()` wires engine + file access + output saving + notifications.
3. `createConverterEngine()` picks `WasmEngine` in the browser or `TauriEngine` inside Tauri.
4. `ConverterScreen` renders the one-page tool UI.
5. `useConverterWorkspace()` coordinates the feature hooks without becoming a god hook.
6. `useFileManager`, `useConversionSettings`, and `useConversionProcess` each own one real behavior boundary.
7. The active engine receives a clean conversion request and returns a structured result.

## Running locally

### Requirements

- Node.js
- npm
- Rust toolchain
- Tauri prerequisites for your OS

For desktop builds, FFmpeg sidecars matter.

The Tauri config runs `npm run ffmpeg:setup` before dev/build. That script:

- checks `src-tauri/binaries`
- if no sidecar exists, tries to find a system `ffmpeg`
- copies it into the Tauri sidecar slot for the active target

For actual release builds, use the correct FFmpeg binary for each target platform instead of relying on a developer machine install.

### Web development

```bash
npm install
npm run dev
```

### Desktop development

```bash
npm install
npm run tauri -- dev
```

### Production builds

```bash
npm run build
npm run tauri -- build
```

## Browser support

The browser runtime requires:

- `WebAssembly`
- `Worker`
- `File`
- `Blob`
- `URL.createObjectURL`

That check lives in [`src/features/converter/check-browser-support.ts`](src/features/converter/check-browser-support.ts).

Even when the browser passes the runtime check, codec/container support and performance still depend on the browser and the bundled FFmpeg WASM core.

## Known limitations

- Browser video is intentionally limited compared to desktop
- AVIF is not exposed in the web runtime
- Preview is disabled above `50 MB`
- Very large desktop video conversions can still take a long time depending on codec, resolution, bitrate, and hardware
- Linux and macOS release builds exist, but broader runtime validation depends on real-device testing

## FFmpeg, notices, and legal docs

This project uses FFmpeg.

Relevant docs in this repo:

- [`docs/THIRD-PARTY-NOTICES.txt`](docs/THIRD-PARTY-NOTICES.txt)
- [`docs/ffmpeg-licensing.md`](docs/ffmpeg-licensing.md)

If you distribute builds publicly, ship the notice and licensing files alongside the release assets.

## Contributing

This codebase prefers boring architecture over clever architecture.

When making changes:

- keep UI code in components
- keep orchestration/state in feature hooks
- keep platform-specific work in `src/platform` or `src-tauri`
- do not reintroduce a god hook or a god component
- do not expose raw FFmpeg flags in the UI
- keep the browser runtime honest about its limits
