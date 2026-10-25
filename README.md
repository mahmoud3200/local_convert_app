# LoConvert

LoConvert is a privacy-first media converter that runs entirely on your device. It converts images, audio, and video locally without uploading files to a server.

- **Web app:** [local-convert-app.vercel.app](https://local-convert-app.vercel.app/)
- **Desktop app:** [GitHub Releases](https://github.com/mahmoud3200/local_convert_app/releases/tag/v1.0-beta)

## What it does

- Converts images, audio, and video
- Handles multiple files in one queue
- Stores reusable default settings per media type
- Supports per-file conversion settings
- Runs the same React UI on two different engines
- Keeps files local on both web and desktop

## One UI, two runtimes

| | Web | Desktop |
| --- | --- | --- |
| Engine | FFmpeg WASM | Native FFmpeg through Tauri v2 |
| Best for | Quick, browser-safe jobs | Larger files and broader format support |

The web build stays intentionally conservative because browser memory and codec support are limited. The desktop build is the stronger path for heavier conversions.

## Quick start

Requirements: Node.js, npm, a Rust toolchain, and the Tauri prerequisites for your OS.

```bash
npm install

# Web development
npm run dev

# Desktop development
npm run tauri -- dev

# Production builds
npm run build
npm run tauri -- build
```

Desktop builds need an FFmpeg sidecar. The setup script checks `src-tauri/binaries` first, then falls back to a system `ffmpeg` during local development. See [Desktop application](docs/03-desktop-application.md) and [Desktop releases](docs/desktop-releases.md).

## Documentation

- [How LoConvert works](docs/01-how-loconvert-works.md) — architecture, layers, conversion flow, and design decisions
- [Web application](docs/02-web-application.md) — browser runtime, limits, deployment, and troubleshooting
- [Desktop application](docs/03-desktop-application.md) — Tauri backend, native FFmpeg, file handling, and releases
- [Analytics](docs/04-analytics.md) — Google Analytics setup, cookie consent, and desktop exclusions
- [Contributing](CONTRIBUTING.md) — setup, architecture rules, and review checklist
- [Desktop releases](docs/desktop-releases.md) — build targets, artifacts, and release steps
- [FFmpeg licensing](docs/ffmpeg-licensing.md) — distribution notes for bundled FFmpeg
- [Third-party notices](docs/THIRD-PARTY-NOTICES.txt)

## Privacy

Files stay on your device in both runtimes.

## License

Original LoConvert source code is licensed under the [Apache License 2.0](LICENSE).

Third-party components keep their own licenses. Desktop builds may bundle a GPL-enabled FFmpeg binary, so read [FFmpeg licensing](docs/ffmpeg-licensing.md) and [Third-party notices](docs/THIRD-PARTY-NOTICES.txt) before distributing installers.
