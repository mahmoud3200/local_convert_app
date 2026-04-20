import { useEffect, useMemo, useState } from "react";
import { MAX_PREVIEW_FILE_SIZE_BYTES } from "@/features/converter/constants";
import { canPreviewFile } from "@/features/converter/preview-rules";
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
  const [previewError, setPreviewError] = useState<{
    fileId: string;
    message: string;
  } | null>(null);
  const isPreviewAllowed = Boolean(file && canPreviewFile(file));
  const activePreviewError =
    file && previewError?.fileId === file.id ? previewError.message : null;
  const mediaUrl = useMemo(() => {
    if (!isOpen || !file || file.kind === "image" || !isPreviewAllowed) {
      return "";
    }

    if (file.previewUrl) {
      return file.previewUrl;
    }

    return file.file ? URL.createObjectURL(file.file) : "";
  }, [file, isOpen, isPreviewAllowed]);

  useEffect(() => {
    return () => {
      if (mediaUrl && file?.file && !file.previewUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [file, mediaUrl]);

  function handlePreviewError(message: string) {
    if (!file) {
      return;
    }

    setPreviewError({ fileId: file.id, message });
  }

  return (
    <ConverterDialogShell
      description="Local preview for the selected file."
      isOpen={isOpen}
      sizeClassName="h-[min(44rem,calc(100vh-2rem))] w-[min(56rem,calc(100vw-2rem))]"
      title={file?.name ?? "Preview"}
      onClose={onClose}
    >
      <div className="grid h-full content-center overflow-auto px-6 pt-6 pb-3">
        {!file ? null : !isPreviewAllowed ? (
          <PreviewUnavailableMessage
            message={
              file.size > MAX_PREVIEW_FILE_SIZE_BYTES
                ? "Local previews are available for files up to 50 MB to avoid loading large media into the app window."
                : "A local preview source is not available for this file."
            }
            title={
              file.size > MAX_PREVIEW_FILE_SIZE_BYTES
                ? "Preview disabled for large files"
                : "Preview unavailable"
            }
          />
        ) : activePreviewError ? (
          <PreviewUnavailableMessage
            message={activePreviewError}
            title="Preview unavailable"
          />
        ) : file.kind === "image" && file.previewUrl ? (
          <div className="overflow-hidden rounded-panel border border-app-border bg-app-subtle">
            <img
              alt={file.name}
              className="max-h-[65vh] w-full object-contain"
              src={file.previewUrl}
              onError={() =>
                handlePreviewError(
                  "The app could not load this local image preview. The file can still be converted.",
                )
              }
            />
          </div>
        ) : file.kind === "video" ? (
          <div className="rounded-panel border border-app-border bg-black p-2">
            <video
              className="block h-[min(30rem,calc(100vh-16rem))] min-h-64 w-full rounded-control bg-black object-contain"
              controls
              playsInline
              preload="metadata"
              src={mediaUrl}
              onError={() =>
                handlePreviewError(
                  "The app could not play this video preview. This can happen when the WebView does not support the file's codec or container.",
                )
              }
            />
          </div>
        ) : (
          <div className="rounded-panel border border-app-border bg-app-subtle p-6">
            <audio
              className="w-full"
              controls
              src={mediaUrl}
              onError={() =>
                handlePreviewError(
                  "The app could not play this audio preview. This can happen when the WebView does not support the file's codec or container.",
                )
              }
            />
          </div>
        )}
      </div>
    </ConverterDialogShell>
  );
}

function PreviewUnavailableMessage({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <div className="rounded-panel border border-app-border bg-app-subtle p-6 text-center">
      <p className="text-sm font-semibold text-app-fg">{title}</p>
      <p className="mt-1 text-sm text-app-muted">{message}</p>
    </div>
  );
}
