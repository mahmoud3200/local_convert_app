import type React from "react";
import { FolderUp } from "lucide-react";

interface UploadDropzoneProps {
  accept: string;
  helperMessage?: string;
  isNativeBrowseEnabled?: boolean;
  supportLabels: string[];
  onFilesSelect: (files: FileList | File[]) => void;
  onNativeBrowse?: () => void | Promise<void>;
}

export function UploadDropzone({
  accept,
  helperMessage,
  isNativeBrowseEnabled = false,
  supportLabels,
  onFilesSelect,
  onNativeBrowse,
}: UploadDropzoneProps) {
  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      onFilesSelect(event.dataTransfer.files);
    }
  }

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
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <div className="rounded-panel bg-app-accent-soft p-4 text-app-accent">
        <FolderUp className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-app-fg">
        Drop files here or browse your device
      </h2>
      <p className="mt-2 max-w-xl text-sm text-app-muted">
        Each file gets its own settings and conversion options.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-app-muted">
        {supportLabels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-app-border bg-app-control px-3 py-1"
          >
            {label}
          </span>
        ))}
      </div>
      {helperMessage ? (
        <p className="mt-4 text-xs text-app-accent">{helperMessage}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {isNativeBrowseEnabled ? (
          <span className="inline-flex h-10 items-center justify-center rounded-control border border-app-border bg-app-control px-4 text-sm font-semibold text-app-fg">
            Select files
          </span>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-control border border-app-border bg-app-control px-4 text-sm font-semibold text-app-fg">
            Select files
          </span>
        )}
      </div>
    </div>
  );

  if (isNativeBrowseEnabled) {
    return (
      <div
        className="block cursor-pointer rounded-panel border-dashed border-app-border border-3 px-6 py-8 transition hover:bg-app-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        role="button"
        tabIndex={0}
        onClick={handleNativeBrowse}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={handleNativeKeyDown}
      >
        {content}
      </div>
    );
  }

  return (
    <label
      className="block rounded-panel border-dashed border-app-border border-3 px-6 py-8 transition hover:bg-app-accent-soft/50"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept={accept}
        className="hidden"
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
