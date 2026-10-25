import type React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  accept: string;
  helperMessage?: string;
  isNativeBrowseEnabled?: boolean;
  onFilesSelect: (files: FileList | File[]) => void;
  onNativeBrowse?: () => void | Promise<void>;
}

export function UploadDropzone({
  accept,
  helperMessage,
  isNativeBrowseEnabled = false,
  onFilesSelect,
  onNativeBrowse,
}: UploadDropzoneProps) {
  const dropzoneClassName = cn(
    "group relative flex min-h-[380px] w-full cursor-pointer flex-col items-center justify-center rounded-[24px] border-[3px] px-6 py-14 text-center backdrop-blur-sm transition-colors duration-200 focus-within:ring-2 focus-within:ring-app-accent/60 focus-within:ring-offset-2 focus-within:ring-offset-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg md:min-h-[610px] md:rounded-[32px] md:px-10 md:py-16",
    "border-white/[0.29] bg-[rgba(30,30,30,0.25)] shadow-[2px_5px_4px_0_rgba(255,255,255,0.3),3px_3px_4px_0_rgba(255,255,255,0.3)] hover:border-white/40 hover:bg-[rgba(30,30,30,0.35)]",
  );

  function handleNativeBrowse() {
    void onNativeBrowse?.();
  }

  function handleNativeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleNativeBrowse();
  }

  const content = (
    <>
      <Upload
        aria-hidden="true"
        className="h-[92px] w-[92px] shrink-0 text-white sm:h-[116px] sm:w-[116px] md:h-[140px] md:w-[140px]"
        strokeWidth={0.9}
      />
      <p className="mt-7 text-[clamp(1.5rem,2.6vw,2.25rem)] font-normal leading-tight text-white md:mt-[30px]">
        Drag &amp; drop files anywhere
      </p>
      <p className="mt-2.5 text-[15px] leading-normal text-app-muted-strong md:text-base">
        Or click to browse through your files
      </p>
      {helperMessage ? (
        <p className="mt-4 max-w-xl text-sm text-app-error" role="status">
          {helperMessage}
        </p>
      ) : null}
    </>
  );

  if (isNativeBrowseEnabled) {
    return (
      <div
        aria-label="Select files to convert"
        className={dropzoneClassName}
        role="button"
        tabIndex={0}
        onClick={handleNativeBrowse}
        onKeyDown={handleNativeKeyDown}
      >
        {content}
      </div>
    );
  }

  return (
    <label className={dropzoneClassName}>
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
