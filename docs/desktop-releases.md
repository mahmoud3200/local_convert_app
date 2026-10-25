# Desktop releases

This document explains how desktop releases work for LoConvert.

The desktop app is built with Tauri v2 and uses native FFmpeg through the Rust backend. The web app and desktop app share the same React UI, but desktop releases package:

- the Tauri shell
- the built frontend
- the native Rust backend
- an FFmpeg sidecar in `src-tauri/binaries`

## Release targets

The repository is set up to build these desktop targets:

- Windows x64
- Linux x64
- macOS Intel
- macOS Apple Silicon

The GitHub Actions workflow for desktop builds is:

- [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml)

## Current bundle outputs

Tauri generates platform-native installers or distributables.

### Windows

Expected outputs:

- `*.exe` via NSIS
- `*.msi`

Typical examples:

- `LoConvert_1.0.0_x64-setup.exe`
- `LoConvert_1.0.0_x64_en-US.msi`

### Linux

Expected outputs:

- `*.AppImage`
- `*.deb`
- `*.rpm`

Typical examples:

- `LoConvert_1.0.0_amd64.AppImage`
- `LoConvert_1.0.0_amd64.deb`
- `LoConvert-1.0.0-1.x86_64.rpm`

### macOS

Expected outputs:

- `*.dmg`

Typical examples:

- `LoConvert_1.0.0_aarch64.dmg`
- `LoConvert_1.0.0_x64.dmg`

## Versioning

There are two separate things to keep clear:

1. Release label
2. Build metadata inside the app/installers

Example:

- GitHub release title/tag: `v1.0-beta`
- Tauri/package version inside installers: `1.0.0`

If you want the installers and app metadata to also say beta, update the project version before building:

- [`package.json`](../package.json)
- [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json)

If you only rename uploaded files after building, the installer metadata does not change.

## How the desktop build works

### Local build

Desktop builds use this Tauri config:

- [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json)

Important behavior:

- `beforeBuildCommand` runs `npm run ffmpeg:setup && npm run build`
- `beforeDevCommand` runs `npm run ffmpeg:setup && npm run dev`
- Tauri bundles the FFmpeg sidecar from `src-tauri/binaries`

Build locally with:

```bash
npm install
npm run tauri -- build
```

### FFmpeg sidecar setup

This repo includes a setup step that prepares the FFmpeg sidecar:

- [`scripts/setup-ffmpeg-sidecar.mjs`](../scripts/setup-ffmpeg-sidecar.mjs)

What it does:

- checks whether a target-specific sidecar already exists in `src-tauri/binaries`
- otherwise tries to find a system `ffmpeg`
- copies that executable into the correct Tauri sidecar slot for the active target

This is convenient for local development, but for serious release work the intended approach is:

- use a known FFmpeg binary for each target platform
- keep sidecars explicit and reproducible

Do not rely on a random developer machine FFmpeg install for long-term release reproducibility.

## GitHub Actions release workflow

The desktop workflow builds on:

- push to `main`
- tags matching `v*`
- manual trigger with `workflow_dispatch`

The workflow currently:

1. checks out the repo
2. installs Node
3. installs Rust and target toolchains
4. installs Linux/macOS build prerequisites when needed
5. installs frontend dependencies
6. prepares the FFmpeg sidecar
7. runs `npm run tauri build`
8. uploads the generated bundle files as workflow artifacts

Workflow file:

- [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml)

## Where build files end up

### Local builds

Local Tauri bundles are generated under:

- `src-tauri/target/release/bundle`
- or target-specific paths such as `src-tauri/target/<triple>/release/bundle`

### GitHub Actions

GitHub Actions uploads the generated desktop bundles as workflow artifacts.

That means:

- they are attached to the workflow run
- they are not automatically attached to a GitHub Release unless you upload them yourself or add release-publishing steps

## What to upload to a GitHub Release

Upload the packaged installer/distribution files only.

Good release assets:

- Windows: `.exe`, `.msi`
- Linux: `.AppImage`, `.deb`, `.rpm`
- macOS: `.dmg`

Do not upload:

- bundle helper folders
- extracted `AppDir`
- intermediate packaging folders
- helper scripts produced during bundling

## Recommended naming for public release assets

For user-facing GitHub Releases, clearer names are better than raw Tauri defaults.

Example naming:

- `local-convert-v1.0-beta-windows-x64-setup.exe`
- `local-convert-v1.0-beta-windows-x64-installer.msi`
- `local-convert-v1.0-beta-linux-x64.AppImage`
- `local-convert-v1.0-beta-linux-x64.deb`
- `local-convert-v1.0-beta-linux-x64.rpm`
- `local-convert-v1.0-beta-macos-apple-silicon.dmg`

This only changes the uploaded filename, not the internal installer metadata.

## Files that should accompany public desktop releases

Because desktop builds use FFmpeg, ship the notice and licensing files with the release:

- [`LICENSE`](../LICENSE)
- [`THIRD-PARTY-NOTICES.txt`](./THIRD-PARTY-NOTICES.txt)
- [`ffmpeg-licensing.md`](./ffmpeg-licensing.md)

Those can be uploaded as extra release assets.

## Desktop-specific behavior worth documenting in release notes

The desktop app is the stronger runtime and should be described honestly.

Good things to mention:

- native FFmpeg backend
- better support for larger files than the browser version
- desktop notifications when conversions complete
- ZIP download for batch output
- preview is still limited for large files to protect the WebView

Also be explicit about current confidence:

- Windows runtime is tested
- Linux/macOS builds may still need broader real-device validation if that is still true at release time

## Suggested release checklist

Before publishing a desktop release:

1. Confirm the version/tag you want to publish.
2. Build the frontend and desktop app.
3. Verify FFmpeg sidecar exists for the target build.
4. Open the produced desktop build on the target OS if possible.
5. Test at least:
   - image conversion
   - audio conversion
   - video conversion
   - convert all
   - download all
   - queue restore
   - remove while converting
6. Upload only the packaged installer files.
7. Upload `LICENSE`, `THIRD-PARTY-NOTICES.txt`, and `ffmpeg-licensing.md`.
8. Add release notes describing platform coverage and known limitations.

## Suggested release note wording

Short version:

> The desktop build is the recommended version of LoConvert for heavier jobs. It uses native FFmpeg through Tauri for more reliable audio/video conversion and better handling of larger files than the browser version.

## Future improvements

If this project keeps shipping desktop builds, the next release improvements worth considering are:

- automatic release publishing directly from GitHub Actions
- explicit checksums for release assets
- code signing / notarization where applicable
- stronger platform-by-platform runtime testing
- a single documented versioning policy for tags, app metadata, and uploaded filenames
