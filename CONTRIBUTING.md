# Contributing to LoConvert

Thanks for taking the time to improve LoConvert. This project values boring, predictable architecture over clever shortcuts.

## Before you start

Please open an issue for large changes before writing a lot of code. That keeps the architecture discussion separate from the implementation.

Small fixes, documentation updates, and focused refactors are welcome as pull requests.

## Setup

Requirements:

- Node.js and npm
- Rust toolchain for desktop work
- Tauri prerequisites for your OS
- FFmpeg for desktop development

```bash
npm install
npm run dev          # web
npm run tauri -- dev # desktop
```

## Project structure

The main boundaries are intentional:

- `src/app` — app shell and web-only integrations
- `src/components/ui` — reusable UI primitives
- `src/features/converter/components` — converter-specific UI
- `src/features/converter/hooks` — feature state and orchestration
- `src/features/converter/files` — queue persistence and file helpers
- `src/features/converter/settings` — defaults, sanitizing, and settings rules
- `src/features/converter/conversion` — request construction and messages
- `src/platform` — runtime boundary for conversion, files, output, notifications, and power
- `src-tauri` — desktop backend

Keep code inside the boundary that owns the behavior.

## Architecture rules

- Keep UI code in components.
- Keep orchestration and state in feature hooks.
- Keep runtime-specific work in `src/platform` or `src-tauri`.
- Do not reintroduce a god hook or a god component.
- Do not expose raw FFmpeg flags in the UI.
- Keep the browser runtime honest about its limits.
- Prefer capability-driven UI over hardcoded per-runtime conditionals in components.
- Preserve cancellation and cleanup behavior when changing conversion flow.

## Adding or changing formats

Formats belong to engine capabilities, not to one global list.

When adding a format:

1. Add it to the relevant `OutputFormat` union in `src/features/converter/types.ts` if needed.
2. Add it to the capable engine's `outputs` map.
3. Update the browser and desktop argument builders if the format requires special handling.
4. Update MIME mappings if the output needs an explicit content type.
5. Update the web and desktop docs with the new support level.

Do not advertise a format in the UI until the engine can actually produce it.

## Analytics and consent

The analytics rules are part of the privacy contract:

- Web analytics must not load in the desktop app.
- Google Analytics must not load before consent.
- The cookie banner must not appear in the desktop app.
- Rejecting consent must keep Google Analytics off.
- Do not add tracking that bypasses the consent decision.

Full behavior, setup, and implementation notes live in [Analytics](docs/04-analytics.md).

## Code style

- Keep TypeScript strict and avoid `any`.
- Follow the existing import aliases: use `@/` for `src` imports.
- Match the surrounding naming and file structure.
- Prefer small modules with one clear responsibility.
- Add comments only where the reason is not obvious from the code.
- Keep user-facing errors clear and actionable.

## Quality checks

Run these before opening a pull request:

```bash
npm run lint
npm run build
```

For desktop changes, also run:

```bash
npm run tauri -- build
```

Manually verify the affected runtime. At minimum, test:

- image conversion
- audio conversion
- video conversion
- convert all
- download one output
- download all as ZIP
- removing a file while it is converting
- desktop queue restore, when touching desktop persistence

## Pull request checklist

- The change is scoped to one feature or fix.
- The architecture boundaries still hold.
- Web and desktop capabilities are still accurate.
- Analytics still respects consent and stays disabled on desktop.
- Documentation is updated when behavior changes.
- `npm run lint` and `npm run build` pass.
- The pull request explains what changed and how it was tested.

## Documentation

Keep the root README short. Put deeper explanations in `docs/`:

- [How LoConvert works](docs/01-how-loconvert-works.md)
- [Web application](docs/02-web-application.md)
- [Desktop application](docs/03-desktop-application.md)
- [Analytics](docs/04-analytics.md)
- [Desktop releases](docs/desktop-releases.md)
- [FFmpeg licensing](docs/ffmpeg-licensing.md)

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).

Third-party components keep their own licenses. See [Third-party notices](docs/THIRD-PARTY-NOTICES.txt).
