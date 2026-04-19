# FFmpeg Licensing Notes

This project can run FFmpeg in two ways:

- Browser mode uses the `ffmpeg.wasm` npm packages.
- Desktop mode uses a native FFmpeg executable through a Tauri sidecar first, then a system `ffmpeg` fallback.

FFmpeg itself is licensed under LGPL 2.1 or later, unless GPL-only components are enabled. When GPL components are enabled, the whole FFmpeg binary is GPL.

The current Windows development sidecar setup downloads the Gyan `ffmpeg-release-essentials` build. That build enables GPL components, so treat the bundled binary as GPL for distribution planning.

Before shipping a desktop installer, decide one distribution policy:

- Bundle a GPL FFmpeg build and comply with GPL obligations for the distributed app package.
- Bundle an LGPL-only FFmpeg build and comply with LGPL obligations.
- Do not bundle FFmpeg; require a user-installed system FFmpeg and document that requirement.

This file is not legal advice. It is a technical checklist so we do not accidentally ship a native FFmpeg binary without reviewing license obligations.

References:

- https://ffmpeg.org/legal.html
- https://www.gyan.dev/ffmpeg/builds/
