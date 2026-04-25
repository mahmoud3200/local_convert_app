import { MonitorDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESKTOP_DOWNLOAD_LINK } from "@/features/converter/constants";

interface DesktopAppCalloutProps {
  isVisible: boolean;
}

export function DesktopAppCallout({ isVisible }: DesktopAppCalloutProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-panel border border-app-border bg-app-accent-soft px-4 py-3 text-app-fg shadow-s">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-control bg-app-control p-2.5 text-app-accent shadow-s">
            <MonitorDown aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">
              Unlock full power with the desktop app
            </h3>
            <p className="text-sm text-app-muted">
              Browser conversion is optimized for speed, which limits video
              processing. The desktop app removes those limits, convert videos
              to any supported format, handle large files, and fine-tune output
              with advanced controls like quality, compression, bitrate, and
              frame rate. It also supports formats like AVIF for images.
            </p>
          </div>
        </div>

        <Button
          className="min-w-37.5"
          disabled={!DESKTOP_DOWNLOAD_LINK}
          variant="secondary"
          onClick={() => {
            if (DESKTOP_DOWNLOAD_LINK) {
              window.open(
                DESKTOP_DOWNLOAD_LINK,
                "_blank",
                "noopener,noreferrer",
              );
            }
          }}
        >
          Download desktop app
        </Button>
      </div>
    </div>
  );
}
