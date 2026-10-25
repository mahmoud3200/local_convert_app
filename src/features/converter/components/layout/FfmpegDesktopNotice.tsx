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
    <div className="mt-4 flex items-start justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-app-fg">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Desktop conversion uses FFmpeg</h3>
        <p className="text-[13px] text-app-muted">
          LoConvert uses FFmpeg for desktop media conversion. FFmpeg license
          and source details are included with the release notes.
        </p>
      </div>

      <Button
        aria-label="Dismiss FFmpeg notice"
        className="-mr-1 -mt-1 h-8 w-8 shrink-0"
        size="icon"
        variant="ghost"
        onClick={onDismiss}
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}
