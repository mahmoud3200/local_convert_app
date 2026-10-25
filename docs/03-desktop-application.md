# Desktop application

The desktop build packages the same React UI inside a Tauri v2 shell and replaces the browser conversion engine with native FFmpeg.

It is the recommended version for heavier jobs because it avoids browser memory limits, supports more output formats, and can work with files directly from disk.

## Architecture

```text
React UI (same as web)
  └─ TauriEngine
       └─ Tauri commands (Rust)
            ├─ FFmpeg argument builder
            ├─ bundled FFmpeg sidecar
            └─ system ffmpeg fallback
```

The React UI does not know which engine is active. `createConverterEngine()` detects Tauri and returns `TauriEngine`; otherwise it returns the browser WASM engine.

The Rust backend is split by responsibility:

- `commands/` exposes Tauri command handlers
- `ffmpeg/` builds arguments and runs tracked FFmpeg processes
- `conversion_paths.rs` handles generated output paths
- `power.rs` manages sleep inhibition
- `types.rs` contains shared request and response types

## Native FFmpeg resolution

Desktop conversion follows a deterministic fallback chain:

1. Try the bundled FFmpeg sidecar in `src-tauri/binaries`.
2. If the sidecar cannot start, try `ffmpeg` on the system `PATH`.
3. If neither works, return an explicit missing-engine error.

The error message includes both failures so the user knows whether the sidecar is missing or the system install is unavailable.

For release builds, bundle a known FFmpeg binary per target platform. Relying on a developer machine install is acceptable for local development, not for reproducible releases.

## Native paths first

When files are selected through the desktop picker, the app keeps the native path and converts directly from disk. This avoids pushing large files through JavaScript memory.

There is a fallback path for browser-style `File` objects, but it is guarded:

- files above `250 MB` are rejected when no native path exists
- the user is told to use the desktop **Select files** button instead

The fallback exists for dropped files and edge cases; the native picker is the intended path.

## Supported outputs

The desktop engine supports more formats than the web engine.

| Media | Formats |
| --- | --- |
| Image | PNG, JPG/JPEG, WebP, GIF, AVIF, BMP, TIF/TIFF |
| Audio | MP3, WAV, AAC, OGG, FLAC, M4A |
| Video | MP4, WebM, MOV, MKV, AVI |

Advanced settings on desktop:

- image: quality, compression, resolution, metadata removal
- audio: bitrate, sample rate, channels, metadata removal
- video: quality, resolution, bitrate, frame rate, metadata removal

## Conversion lifecycle

1. The native picker returns file paths and metadata.
2. The UI creates queue entries with native paths and previews when the file is small enough.
3. `TauriEngine.convert()` invokes `convert_file_path` with the source path and settings.
4. Rust builds the FFmpeg arguments and starts the sidecar or system FFmpeg.
5. Progress and exit status are tracked per job.
6. Generated output is saved through a native save dialog.
7. Batch downloads are zipped before the save dialog opens.

Short-lived child processes are tracked in `RunningFfmpegProcesses`. Cancelling a file, clearing the queue, or closing the app kills the matching process.

## Queue persistence

The desktop queue persists files that still have native paths:

- storage key: `local-convert:desktop-queue:v1`
- restored files must still exist on disk
- invalid settings are sanitized on load
- preview URLs are never restored
- missing paths are removed from the restored queue

This gives users a useful restart experience without pretending a deleted file is still available.

## Desktop integrations

The desktop build adds behavior that a browser cannot provide:

- native file picker
- native save dialogs
- desktop notifications when conversion finishes
- sleep prevention while conversion is running
- ZIP export for batch output
- cleanup of running FFmpeg processes on exit

Sleep prevention is managed through the Rust `SleepInhibitor`. On Windows it uses the platform power API; on macOS and Linux it uses `caffeinate` or `systemd-inhibit` when available.

## Privacy

The desktop app makes no analytics requests. See [Analytics](04-analytics.md) for the full policy and implementation.

## Development

Requirements:

- Node.js and npm
- Rust toolchain
- Tauri prerequisites for your OS
- FFmpeg available locally, or a sidecar already present

```bash
npm install
npm run tauri -- dev
```

Tauri runs `npm run ffmpeg:setup` before development. The setup script checks `src-tauri/binaries` and copies a system FFmpeg into the correct sidecar slot when needed.

## Production build

```bash
npm run tauri -- build
```

Tauri runs the FFmpeg setup and the frontend build before packaging. Installers are written under:

- `src-tauri/target/release/bundle`
- or a target-specific path such as `src-tauri/target/<triple>/release/bundle`

The full release workflow, target list, and asset naming are documented in [Desktop releases](desktop-releases.md).

## Building across platforms

The repository is configured for:

- Windows x64
- Linux x64
- macOS Intel
- macOS Apple Silicon

Desktop builds should be produced on their target OS. Bundling a correct FFmpeg sidecar per platform is part of the release process.

## Licensing and distribution

Desktop builds can bundle FFmpeg, and the current Windows sidecar setup uses a GPL-enabled build. That means:

- LoConvert's original source is Apache-2.0
- FFmpeg keeps its own license
- a bundled GPL FFmpeg binary brings GPL obligations for the distributed package

Read [FFmpeg licensing](ffmpeg-licensing.md) and include [Third-party notices](THIRD-PARTY-NOTICES.txt) with public releases.

## Known limitations

- Very large video jobs can still take a long time depending on codec, resolution, bitrate, and hardware.
- Preview generation is still conservative for large files because the UI runs inside a WebView.
- Desktop builds depend on a correct FFmpeg sidecar or a working system FFmpeg.
- Linux and macOS builds exist, but broader runtime validation depends on real-device testing.

## Related docs

- [How LoConvert works](01-how-loconvert-works.md)
- [Web application](02-web-application.md)
- [Analytics](04-analytics.md)
- [Desktop releases](desktop-releases.md)
- [FFmpeg licensing](ffmpeg-licensing.md)
- [Contributing](../CONTRIBUTING.md)
