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
    "group relative flex min-h-[clamp(15rem,40dvh,38.125rem)] max-w-[1350px] mx-auto cursor-pointer flex-col items-center justify-center rounded-[24px] border-[3px] px-6 py-[clamp(2rem,6dvh,3.5rem)] text-center backdrop-blur-sm transition-[background-color,border-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-app-accent/60 focus-within:ring-offset-2 focus-within:ring-offset-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg md:rounded-[32px] md:px-10 md:py-[clamp(2.5rem,7dvh,4rem)]",
    "border-white/[0.29] bg-[rgba(30,30,30,0.25)] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_24px_60px_-28px_rgba(0,0,0,0.85),0_0_60px_-30px_rgba(124,211,249,0.25)] hover:border-white/40 hover:bg-[rgba(30,30,30,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_28px_70px_-28px_rgba(0,0,0,0.9),0_0_72px_-28px_rgba(124,211,249,0.32)]",
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
        className="size-20 sm:size-24 shrink-0 text-white"
        strokeWidth={0.9}
      />
      <p className="mt-7 text-[clamp(1.5rem,2.6vw,2.25rem)] font-normal leading-tight text-white md:mt-7.5">
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
