import type React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddMoreFilesProps {
  accept: string;
  isNativeBrowseEnabled: boolean;
  onFilesSelect: (files: FileList | File[]) => void;
  onNativeBrowse?: () => void | Promise<void>;
}

export function AddMoreFiles({
  accept,
  isNativeBrowseEnabled,
  onFilesSelect,
  onNativeBrowse,
}: AddMoreFilesProps) {
  function handleNativeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void onNativeBrowse?.();
  }

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-app-accent bg-app-accent-soft text-app-accent">
        <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-sm font-semibold leading-[17px] text-white">Add more files</span>
        <span className="text-[13px] leading-4 text-app-muted">
          Click to browse or drag files anywhere
        </span>
      </span>
    </>
  );

  const className = cn(
    "flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-[16px] border border-dashed border-app-accent bg-white/[0.04] px-5 py-4 text-left shadow-s transition hover:bg-app-accent-soft focus-within:outline-none focus-within:ring-2 focus-within:ring-app-accent/60 focus-within:ring-offset-2 focus-within:ring-offset-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg",
  );

  if (isNativeBrowseEnabled) {
    return (
      <div
        aria-label="Add more files"
        className={className}
        role="button"
        tabIndex={0}
        onClick={() => void onNativeBrowse?.()}
        onKeyDown={handleNativeKeyDown}
      >
        {content}
      </div>
    );
  }

  return (
    <label className={className}>
      <input
        accept={accept}
        className="sr-only"
        multiple
        type="file"
        onChange={(event) =>
          event.target.files ? onFilesSelect(event.target.files) : undefined
        }
      />
      {content}
    </label>
  );
}
