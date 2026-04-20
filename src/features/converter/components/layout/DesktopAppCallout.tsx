import { MonitorDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const desktopDownloadUrl = (
  import.meta as ImportMeta & {
    env?: { VITE_DESKTOP_DOWNLOAD_URL?: string };
  }
).env?.VITE_DESKTOP_DOWNLOAD_URL;

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
            <h3 className="text-sm font-semibold">Need more power?</h3>
            <p className="text-sm text-app-muted">
              Use the desktop app for larger files and smoother saving.
            </p>
          </div>
        </div>

        <Button
          className="w-full md:w-auto"
          disabled={!desktopDownloadUrl}
          variant="secondary"
          onClick={() => {
            if (desktopDownloadUrl) {
              window.open(desktopDownloadUrl, "_blank", "noopener,noreferrer");
            }
          }}
        >
          Download desktop app
        </Button>
      </div>
    </div>
  );
}
