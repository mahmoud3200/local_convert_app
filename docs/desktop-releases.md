# Desktop Releases

Desktop builds are created by `.github/workflows/desktop-release.yml`.

The workflow builds:

- Windows x64
- Linux x64
- macOS Intel
- macOS Apple Silicon

Run it manually from GitHub Actions, or create a version tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The workflow creates a draft GitHub Release named from the Tauri app version and uploads the generated installers/bundles.

Important FFmpeg note:

- Windows uses the downloaded Gyan FFmpeg build.
- Linux/macOS currently copy the runner's installed `ffmpeg` into the Tauri sidecar slot so CI can build.
- Before public distribution, replace Linux/macOS sidecars with portable FFmpeg binaries that work on clean user machines and review `docs/ffmpeg-licensing.md`.

Unsigned macOS builds may show Gatekeeper warnings. Proper public macOS distribution needs Apple Developer signing and notarization.
