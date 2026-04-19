import { useEffect, useMemo } from "react";
import type { ManagedConversionFile } from "@/features/converter/types";
import { ConverterDialogShell } from "./ConverterDialogShell";

interface FilePreviewDialogProps {
  file: ManagedConversionFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewDialog({
  file,
  isOpen,
  onClose,
}: FilePreviewDialogProps) {
  const mediaUrl = useMemo(() => {
    if (!file || file.kind === "image") {
      return "";
    }

    return URL.createObjectURL(file.file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  return (
    <ConverterDialogShell
      description="Local preview for the selected file."
      isOpen={isOpen}
      sizeClassName="h-[min(44rem,calc(100vh-2rem))] w-[min(56rem,calc(100vw-2rem))]"
      title={file?.name ?? "Preview"}
      onClose={onClose}
    >
      <div className="h-full overflow-auto px-6 pt-6 pb-3 grid content-center">
        {!file ? null : file.kind === "image" && file.previewUrl ? (
          <div className="overflow-hidden rounded-panel border border-app-border bg-app-subtle">
            <img
              alt={file.name}
              className="max-h-[65vh] w-full object-contain"
              src={file.previewUrl}
            />
          </div>
        ) : file.kind === "video" ? (
          <div className="overflow-hidden rounded-panel border border-app-border">
            <video
              className="max-h-[70vh] w-full rounded-control bg-black"
              controls
              src={mediaUrl}
            />
          </div>
        ) : (
          <div className="rounded-panel border border-app-border bg-app-subtle p-6">
            <audio className="w-full" controls src={mediaUrl} />
          </div>
        )}
      </div>
    </ConverterDialogShell>
  );
}
