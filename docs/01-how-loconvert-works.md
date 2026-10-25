# How LoConvert works

LoConvert is one React application with one UI and two interchangeable conversion engines:

- a browser engine built on `ffmpeg.wasm`
- a desktop engine built on Tauri v2 and native FFmpeg

The UI never imports either engine directly. It talks to a platform boundary, and that boundary selects the correct implementation at runtime.

## At a glance

```text
React UI
  └─ feature hooks (queue, settings, conversion orchestration)
       └─ ConverterPlatformServices
            ├─ WasmEngine        (web)
            │    └─ ffmpeg.wasm worker
            └─ TauriEngine       (desktop)
                 └─ Rust commands
                      └─ native FFmpeg sidecar or system ffmpeg
```

## Layers

### 1. UI components

Converter UI lives in `src/features/converter/components`:

- `layout/` owns the screen shell, hero, dropzone, dropdown notice, and dialogs wiring
- `file-list/` owns the queue rows and batch actions
- `dialogs/` owns file settings and global defaults
- `settings/` contains the reusable settings controls

UI components hold small presentation state only. They do not build FFmpeg arguments or call Tauri commands.

### 2. Feature hooks

`src/features/converter/hooks` coordinates behavior without collapsing everything into one giant hook:

- `useConverterWorkspace` combines the smaller hooks and exposes the actions used by the screen
- `useFileManager` owns the file queue and file metadata
- `useConversionSettings` owns per-file settings and saved defaults
- `useConversionProcess` owns conversion, cancellation, downloads, notifications, and sleep prevention
- `useDesktopQueueHydration` restores the desktop queue from `localStorage`

### 3. Platform boundary

`src/platform` is the runtime boundary. It handles:

- engine selection
- browser vs desktop file access
- output saving and ZIP creation
- desktop notifications
- image dimension probing
- sleep prevention
- external links

`createConverterPlatform()` wires those services into one object. It does not know about React rendering.

### 4. Conversion engines

Both engines implement `ConverterEngine` from `src/platform/converter/engine.ts`:

- `capabilities` describes supported formats and controls
- `init()` prepares the engine
- `convert()` runs a conversion and returns a blob or native path
- `cancel()` stops an active job

`createConverterEngine()` returns `TauriEngine` inside Tauri and `WasmEngine` in a browser. Engines are cached so they are not recreated on every render.

### 5. Desktop backend

The Rust side in `src-tauri/src` exposes Tauri commands for:

- path-based and byte-based conversion
- cancellation
- native file metadata and path checks
- saving and zipping generated output
- sleep inhibition
- opening external links

The Rust backend tracks child FFmpeg processes so they can be cancelled or killed when the app closes.

## Runtime selection

Runtime detection lives in `src/platform/tauri-runtime.ts`. It checks both Tauri's `isTauri()` helper and the `__TAURI_INTERNALS__` global.

That single check drives several behaviors:

- which engine is created
- whether the native file picker is used
- whether desktop-only notices appear
- whether the desktop queue is persisted
- whether analytics and the cookie banner are enabled

## Capability-driven UI

Each engine returns an `EngineCapabilities` object:

```ts
type EngineCapabilities = {
  runtime: "web-wasm" | "tauri-native";
  label: string;
  outputs: Record<MediaKind, string[]>;
  advancedSettings: Record<MediaKind, AdvancedSettingCapabilities>;
  notes: string[];
};
```

The UI derives valid formats and visible settings from those capabilities instead of hardcoding one global set. This is why:

- AVIF is hidden on the web but available on desktop
- browser video output is limited to the original format
- audio controls do not appear for image files
- the browser can document its limitations directly in the interface

No raw FFmpeg flags are exposed to users. The UI works with domain settings such as format, quality, resolution, bitrate, frame rate, sample rate, channels, and metadata removal.

## Conversion lifecycle

1. A file is added through the browser input, drag and drop, or the desktop picker.
2. `useFileManager` detects the media kind, stores metadata, and creates a preview URL when the file is small enough.
3. `useConversionSettings` assigns per-file settings from the saved defaults.
4. The user reviews or changes settings for one file, or edits defaults for a media kind.
5. `useConversionProcess` builds a `ConvertRequest` and calls the active engine.
6. The engine converts locally and returns either a `Blob` or a native output path.
7. `createDownloadableOutput()` wraps the result for the platform.
8. The user saves one output, or downloads the whole batch as a ZIP.

## Settings model

Settings are split into:

- a format selection
- advanced settings such as quality, compression, resolution, bitrate, frame rate, sample rate, channels, and metadata removal

Defaults are stored per media kind in `localStorage`. Per-file settings are held in memory and are not persisted. Every settings update is sanitized against the active engine capabilities before it is applied.

## Persistence

Two persistence paths exist:

- default settings per media kind
- desktop queue state for files that still have a native path

The desktop queue snapshot only includes native-path files. On restore, missing paths are filtered out, settings are sanitized, and preview URLs are intentionally not restored.

Browser files cannot be restored after a reload because the browser does not grant persistent access to a dropped `File` object.

## Cancellation and lifecycle

Conversion jobs are cancellable by design:

- removing a converting file cancels its job
- clearing the queue cancels active jobs
- changing settings resets the file's conversion state
- closing the desktop app kills running FFmpeg processes
- `beforeunload` and `pagehide` release running work in the browser

Long-running local media work should never outlive the UI that started it.

## Privacy boundaries

- Files are read and converted on the device.
- The web build does not upload media to a conversion server.
- The desktop build does not use analytics.
- Web analytics are opt-in and documented in [Analytics](04-analytics.md).

## Key files

Start with these:

- `src/app/App.tsx`
- `src/features/converter/components/layout/ConverterScreen.tsx`
- `src/features/converter/hooks/useConverterWorkspace.ts`
- `src/features/converter/hooks/useConversionProcess.ts`
- `src/platform/create-converter-platform.ts`
- `src/platform/converter/create-engine.ts`
- `src/platform/converter/wasm-engine.ts`
- `src/platform/converter/tauri-engine.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/src/ffmpeg/runner.rs`

## Related docs

- [Web application](02-web-application.md)
- [Desktop application](03-desktop-application.md)
- [Analytics](04-analytics.md)
- [Contributing](../CONTRIBUTING.md)
