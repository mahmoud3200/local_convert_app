import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface SettingsOverlayFrameProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  headerAside?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle: React.ReactNode;
  title: string;
  onClose: () => void;
}

export function SettingsOverlayFrame({
  children,
  footer,
  headerAside,
  icon,
  subtitle,
  title,
  onClose,
}: SettingsOverlayFrameProps) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-4 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(1120px,calc(100vw_-_2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#141e2d] text-white shadow-[0_48px_120px_-32px_rgba(0,0,0,0.85)] outline-none",
            "md:top-[5vh] md:max-h-[calc(100dvh-10vh)]",
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 pr-4 pl-6 pt-8 pb-6 md:pr-9 md:pl-9">
            <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-[10px] gap-y-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-app-accent/25 bg-app-accent/10 text-app-accent">
                {icon}
              </div>

              <div className="min-w-0">
                <DialogPrimitive.Title className="font-display text-[18px] leading-[23px] font-bold text-white">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 truncate text-[13px] leading-[17px] text-white/38">
                  {subtitle}
                </DialogPrimitive.Description>
              </div>

              {headerAside ? (
                <div className="col-start-2">{headerAside}</div>
              ) : null}
            </div>

            <DialogPrimitive.Close
              aria-label="Close settings"
              className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-white/[0.09] bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-4 focus-visible:ring-app-accent/20 focus-visible:outline-none"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-8 pb-8 md:px-9">
            {children}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/[0.07] px-6 pt-5 pb-6 md:px-9">
            {footer}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
