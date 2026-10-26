import { ArrowDownToLine, Settings2 } from "lucide-react";
import githubMark from "@/assets/github-mark.svg";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConverterHeaderProps {
  showInstallApp: boolean;
  onInstallApp: () => void;
  onOpenPreferences: () => void;
  onOpenRepository: () => void;
}

export function ConverterHeader({
  showInstallApp,
  onInstallApp,
  onOpenPreferences,
  onOpenRepository,
}: ConverterHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <span className="font-display text-[26px] font-bold leading-none tracking-tight text-white sm:text-[32px]">
        LoConvert
      </span>

      <div className="flex items-center gap-2 sm:gap-3.75">
        {showInstallApp ? (
          <Button
            className="h-10.25 gap-1.5 rounded-full border-white/90 bg-transparent px-3 text-[16px] font-normal text-white hover:border-white hover:bg-white/10 hover:text-white sm:gap-1.25 sm:px-5 sm:text-[18px]"
            variant="secondary"
            onClick={onInstallApp}
          >
            <ArrowDownToLine className="size-4.5 shrink-0" strokeWidth={2.4} />
            <span className="sr-only sm:not-sr-only">Install App</span>
          </Button>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Open preferences"
              className="size-10.25 shrink-0 rounded-full text-white/75 hover:bg-white/10 hover:text-white"
              size="icon"
              variant="ghost"
              onClick={onOpenPreferences}
            >
              <Settings2 className="h-5 w-5" strokeWidth={1.8} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preferences</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Open the LoConvert repository on GitHub"
              className="size-10.25 shrink-0 rounded-full p-0 hover:bg-white/10"
              size="icon"
              variant="ghost"
              onClick={onOpenRepository}
            >
              <img
                alt=""
                aria-hidden="true"
                className="size-10.25"
                src={githubMark}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View on GitHub</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
