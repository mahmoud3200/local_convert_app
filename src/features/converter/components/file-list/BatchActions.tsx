import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-panel shadow-s bg-app-subtle px-4 py-4">
      <Button
        disabled={!canConvertAll}
        variant="secondary"
        onClick={onConvertAll}
      >
        Convert All
      </Button>
      <Button disabled={!canDownloadAll} onClick={onDownloadAll}>
        <Download aria-hidden="true" className="h-4 w-4" />
        Download All (.zip)
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Clear all files"
            size="icon"
            variant="secondary"
            onClick={onClearAll}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear all</TooltipContent>
      </Tooltip>
    </div>
  );
}
