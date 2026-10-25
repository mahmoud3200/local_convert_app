import {
  ArrowRight,
  Download,
  Loader2,
  Settings2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  ManagedConversionFile,
  OutputFormat,
  SelectOptionValue,
} from "@/features/converter/types";

interface FileRowActionsProps {
  canConvert: boolean;
  canDownload: boolean;
  file: ManagedConversionFile;
  formatOptions: SelectOptionValue<OutputFormat>[];
  selectedFormat: OutputFormat;
  sourceLabel: string;
  onConvert: () => void;
  onDownload: () => void | Promise<void>;
  onFormatChange: (format: OutputFormat) => void;
  onOpenSettings: () => void;
  onRemove: () => void;
}

export function FileRowActions({
  canConvert,
  canDownload,
  file,
  formatOptions,
  selectedFormat,
  sourceLabel,
  onConvert,
  onDownload,
  onFormatChange,
  onOpenSettings,
  onRemove,
}: FileRowActionsProps) {
  const isConverting = file.status === "converting";
  const isDone = file.status === "done";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="flex h-[30px] min-w-[72px] items-center justify-center rounded-[8px] border border-white/19 bg-white/10 px-3 text-[13px] font-semibold uppercase text-white/80 opacity-75">
        {sourceLabel}
      </span>

      <span
        aria-hidden="true"
        className="flex h-[18px] w-[18px] items-center justify-center text-white/40"
      >
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <Select
        className="h-[30px] w-[96px] shrink-0 rounded-[8px] border-white/19 bg-white/[0.08] px-3 text-[13px] font-semibold leading-none text-white hover:border-white/30 hover:bg-white/[0.12]"
        iconClassName="h-3.5 w-3.5 text-white/70"
        options={formatOptions}
        value={selectedFormat}
        onValueChange={(value) => onFormatChange(value as OutputFormat)}
      />

      <Button
        className="h-[31px] gap-1.5 rounded-[8px] border-white/15 bg-white/5 px-3.5 text-[14px] font-normal text-white/75 hover:bg-white/10 hover:text-white"
        size="sm"
        variant="secondary"
        onClick={onOpenSettings}
      >
        <Settings2 aria-hidden="true" className="h-[15px] w-[15px]" />
        Options
      </Button>

      <Button
        className="h-8 gap-1.5 rounded-[8px] px-[18px] text-[13px] font-bold"
        disabled={isDone ? !canDownload : !canConvert || isConverting}
        size="sm"
        onClick={() => (isDone ? onDownload() : onConvert())}
      >
        {isConverting ? (
          <Loader2 aria-hidden="true" className="h-[15px] w-[15px] animate-spin" />
        ) : isDone ? (
          <Download aria-hidden="true" className="h-[15px] w-[15px]" />
        ) : (
          <Zap aria-hidden="true" className="h-[15px] w-[15px]" />
        )}
        {isConverting ? "Converting" : isDone ? "Download" : "Convert"}
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Remove file"
            className="h-[34px] w-[34px] rounded-[8px] border-white/13 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
            size="icon"
            variant="secondary"
            onClick={onRemove}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>
    </div>
  );
}
