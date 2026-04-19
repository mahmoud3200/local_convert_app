import { ShieldCheck } from "lucide-react";

export function ConverterHeader() {
  return (
    <header className="surface-panel flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6 shadow-s">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-app-accent">
          Local Convert
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-app-fg">
          Convert files privately, right on your device
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          No uploads. No limits. Just fast, local conversion for images, audio,
          and video.
        </p>
      </div>

      <div className="inline-flex items-center gap-3 rounded-control border border-app-border bg-app-accent-soft px-4 py-3 text-sm text-app-fg">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <span>Your files never leave your device</span>
      </div>
    </header>
  );
}
