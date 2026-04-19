# FFmpeg Sidecar

Tauri expects bundled external binaries to be target-triple suffixed.

For Windows x64, the local binary should be named:

```text
ffmpeg-x86_64-pc-windows-msvc.exe
```

Common desktop names:

```text
ffmpeg-x86_64-pc-windows-msvc.exe
ffmpeg-aarch64-pc-windows-msvc.exe
ffmpeg-x86_64-apple-darwin
ffmpeg-aarch64-apple-darwin
ffmpeg-x86_64-unknown-linux-gnu
ffmpeg-aarch64-unknown-linux-gnu
```

Run this from the project root to install the local development sidecar:

```sh
npm run ffmpeg:setup
```

The setup script downloads a Windows development build on Windows. On macOS/Linux it copies an existing system `ffmpeg` into this folder for local development.

For release builds, provide a portable FFmpeg binary for each target platform and review `docs/ffmpeg-licensing.md` before distribution.

The binaries are intentionally ignored by git because they are large and have separate licensing/distribution requirements.
