import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getFormatOptionsForKind } from "@/features/converter/files/format-support";
import { cn } from "@/lib/utils";
import { FileKindIcon } from "./FileKindIcon";
import { FileRowActions } from "./FileRowActions";
import { FileStatusLabel } from "./FileStatusLabel";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
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
  onFormatChange: (format: OutputFormat) => void;
  onOpenSettings: () => void;
  onRemove: () => void;
}

export function FileRow({
  canConvert,
  capabilities,
  file,
  canDownload,
  settings,
  onConvert,
  onDownload,
  onFormatChange,
  onOpenSettings,
  onRemove,
}: FileRowProps) {
  const formatOptions = getFormatOptionsForKind(file.kind, capabilities);
  const selectedFormat =
    settings?.format ?? formatOptions[0]?.value ?? "original";
  const sourceLabel = file.extension ? file.extension.toUpperCase() : "FILE";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[16px] border border-white/25 bg-app-row px-4 py-4 shadow-s backdrop-blur-sm md:px-6 md:py-[25px]",
        file.status === "converting" && "file-row-converting",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <FileKindIcon kind={file.kind} />

          <div className="min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-[18rem] truncate text-[16px] font-semibold leading-[19px] text-white">
                  {file.name}
                </p>
              </TooltipTrigger>
              <TooltipContent>{file.name}</TooltipContent>
            </Tooltip>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-4 text-app-muted">
              <span>
                {file.sizeLabel} · {sourceLabel} {file.kind}
              </span>
              <FileStatusLabel status={file.status} />
            </div>
          </div>
        </div>

        <FileRowActions
          canConvert={canConvert}
          canDownload={canDownload}
          file={file}
          formatOptions={formatOptions}
          selectedFormat={selectedFormat}
          sourceLabel={sourceLabel}
          onConvert={onConvert}
          onDownload={onDownload}
          onFormatChange={onFormatChange}
          onOpenSettings={onOpenSettings}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
