import { Download, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchActionsProps {
  canConvertAll: boolean;
  canDownloadAll: boolean;
  onClearAll: () => void;
  onConvertAll: () => void;
  onDownloadAll: () => void | Promise<void>;
}

export function BatchActions({
  canConvertAll,
  canDownloadAll,
  onClearAll,
  onConvertAll,
  onDownloadAll,
}: BatchActionsProps) {
  return (
    <div className="mt-[6px] flex min-h-[60px] flex-wrap items-center justify-end gap-3.5 pr-0 sm:pr-6">
      <Button
        className="h-[37px] gap-[7px] rounded-[10px] px-5 text-sm"
        size="sm"
        variant="danger"
        onClick={onClearAll}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Delete All
      </Button>

      <Button
        className="h-[37px] gap-[7px] rounded-[10px] px-5 text-sm font-semibold text-app-muted-strong"
        disabled={!canDownloadAll}
        size="sm"
        variant="secondary"
        onClick={onDownloadAll}
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        Download All
      </Button>

      <Button
        className="h-[37px] gap-2 rounded-[10px] px-7 text-sm font-bold"
        disabled={!canConvertAll}
        size="sm"
        onClick={onConvertAll}
      >
        <Zap aria-hidden="true" className="h-4 w-4" />
        Convert All
      </Button>
    </div>
  );
}
