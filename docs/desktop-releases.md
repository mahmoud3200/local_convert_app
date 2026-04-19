# Desktop Releases

Desktop builds are created by `.github/workflows/desktop-release.yml`.

The workflow builds:

- Windows x64
- Linux x64
- macOS Intel
- macOS Apple Silicon

Run it manually from GitHub Actions, push to `main`, or create a version tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The workflow uploads each platform build as a GitHub Actions artifact. Open the completed workflow run and download artifacts from the bottom of the run summary page.

Artifacts are not committed into the repository. They only live on the GitHub Actions run page.

The workflow uses `npm install --no-audit --no-fund` instead of `npm ci` because some platform-specific optional packages are resolved differently on Windows, Linux, and macOS runners. `npm ci` is stricter, but it can fail when optional native package entries drift across platforms.

Important FFmpeg note:

- Windows uses the downloaded Gyan FFmpeg build.
- Linux/macOS currently copy the runner's installed `ffmpeg` into the Tauri sidecar slot so CI can build.
- Before public distribution, replace Linux/macOS sidecars with portable FFmpeg binaries that work on clean user machines and review `docs/ffmpeg-licensing.md`.

Unsigned macOS builds may show Gatekeeper warnings. Proper public macOS distribution needs Apple Developer signing and notarization.
