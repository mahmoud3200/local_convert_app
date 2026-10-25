import { Upload } from "lucide-react";

interface GlobalDropOverlayProps {
  isVisible: boolean;
}

export function GlobalDropOverlay({ isVisible }: GlobalDropOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="drop-overlay pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-[#03070d]/80 px-6 backdrop-blur-md"
    >
      <div className="absolute inset-3 rounded-[28px] border-2 border-dashed border-app-accent/55 shadow-[inset_0_0_140px_rgba(124,211,249,0.09)] sm:inset-6" />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <span className="flex h-[88px] w-[88px] items-center justify-center rounded-[26px] border border-app-accent/40 bg-app-accent/10 text-app-accent shadow-[0_0_70px_rgba(124,211,249,0.2)]">
          <Upload aria-hidden="true" className="h-10 w-10" strokeWidth={1.4} />
        </span>
        <p className="mt-7 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-bold text-white">
          Drop files anywhere
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">
          Images, audio, and video · release to add them to the queue
        </p>
      </div>
    </div>
  );
}
