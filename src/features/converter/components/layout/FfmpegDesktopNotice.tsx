import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FfmpegDesktopNoticeProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function FfmpegDesktopNotice({
  isVisible,
  onDismiss,
}: FfmpegDesktopNoticeProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-panel border border-app-border bg-app-subtle px-4 py-3 text-app-fg shadow-s">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Desktop conversion uses FFmpeg</h3>
          <p className="text-sm text-app-muted">
            Local Convert uses FFmpeg for desktop media conversion. FFmpeg
            license and source details are included with the release notes.
          </p>
        </div>

        <Button
          aria-label="Dismiss FFmpeg notice"
          size="icon"
          variant="ghost"
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
