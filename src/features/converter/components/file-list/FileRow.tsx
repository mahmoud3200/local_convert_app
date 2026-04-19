import {
  Download,
  Eye,
  FileAudio,
  FileImage,
  FileVideo,
  Settings2,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildSettingsSummary } from "@/features/converter/settings-summary";
import type {
  FileConversionSettings,
  ManagedConversionFile,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface FileRowProps {
  canConvert: boolean;
  capabilities: EngineCapabilities;
  file: ManagedConversionFile;
  canDownload: boolean;
  settings?: FileConversionSettings;
  onConvert: () => void;
  onDownload: () => void | Promise<void>;
  onOpenPreview: () => void;
  onOpenSettings: () => void;
  onRemove: () => void;
}

function StatusBadge({ status }: { status: ManagedConversionFile["status"] }) {
  const classes =
    status === "done"
      ? "border-app-success-border bg-app-success-soft text-app-success"
      : status === "converting"
        ? "border-app-border bg-app-accent-soft text-app-accent"
        : status === "error"
          ? "border-app-error-border bg-app-error-soft text-app-error"
          : "border-app-border bg-app-control text-app-muted";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${classes}`}
    >
      {status}
    </span>
  );
}

export function FileRow({
  canConvert,
  capabilities,
  file,
  canDownload,
  settings,
  onConvert,
  onDownload,
  onOpenPreview,
  onOpenSettings,
  onRemove,
}: FileRowProps) {
  return (
    <div className="rounded-panel shadow-s bg-app-subtle px-4 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-control shadow-s bg-app-control p-3 text-app-muted">
            {file.kind === "audio" ? (
              <FileAudio aria-hidden="true" className="h-5 w-5" />
            ) : file.kind === "video" ? (
              <FileVideo aria-hidden="true" className="h-5 w-5" />
            ) : (
              <FileImage aria-hidden="true" className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="max-w-80 truncate text-sm font-semibold text-app-fg">
                    {file.name}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{file.name}</TooltipContent>
              </Tooltip>
              <StatusBadge status={file.status} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-app-muted">
              <span>{file.sizeLabel}</span>
              <span>{file.kind}</span>
              <span>{file.type}</span>
              <span>{file.detailsLabel}</span>
            </div>
            {settings ? (
              <p className="mt-2 text-xs text-app-fg">
                {buildSettingsSummary(file.kind, settings, capabilities)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Preview file"
                size="icon"
                variant="secondary"
                onClick={onOpenPreview}
              >
                <Eye aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Open file settings"
                size="icon"
                variant="secondary"
                onClick={onOpenSettings}
              >
                <Settings2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <Button
            disabled={!canConvert}
            variant="secondary"
            onClick={onConvert}
          >
            <WandSparkles aria-hidden="true" className="h-4 w-4" />
            Convert
          </Button>
          <Button
            disabled={!canDownload}
            variant="secondary"
            onClick={onDownload}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Remove file"
                size="icon"
                variant="secondary"
                onClick={onRemove}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
