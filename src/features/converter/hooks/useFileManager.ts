import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_PREVIEW_FILE_SIZE_BYTES } from "@/features/converter/constants";
import { formatBytes } from "@/features/converter/file-formatting";
import {
  getDetectedFileInfo,
  getDetectedFileInfoFromName,
} from "@/features/converter/format-support";
import { loadMediaDimensions } from "@/platform/preview/media-dimensions";
import type { NativeSelectedFile } from "@/platform/files/types";
import type { EngineCapabilities } from "@/platform/converter/engine";
import type {
  ManagedConversionFile,
  ManagedFileStatus,
} from "@/features/converter/types";

export function useFileManager(
  capabilities?: EngineCapabilities,
  initialFiles: ManagedConversionFile[] = [],
) {
  const [files, setFiles] = useState<ManagedConversionFile[]>(initialFiles);
  const [message, setMessage] = useState<string>("");
  const filesRef = useRef<ManagedConversionFile[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const filesById = useMemo(
    () => Object.fromEntries(files.map((file) => [file.id, file])),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const file of filesRef.current) {
        if (file.previewUrl && file.shouldRevokePreviewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      }
    };
  }, []);

  function updateFile(id: string, updater: (file: ManagedConversionFile) => ManagedConversionFile) {
    setFiles((current) =>
      current.map((file) => (file.id === id ? updater(file) : file)),
    );
  }

  function updateFileStatus(id: string, status: ManagedFileStatus) {
    updateFile(id, (file) => ({ ...file, status }));
  }

  function setFilePreview(
    id: string,
    previewUrl: string | null,
    shouldRevokePreviewUrl: boolean,
  ) {
    updateFile(id, (file) => {
      if (
        file.previewUrl &&
        file.previewUrl !== previewUrl &&
        file.shouldRevokePreviewUrl
      ) {
        URL.revokeObjectURL(file.previewUrl);
      }

      return {
        ...file,
        previewUrl,
        shouldRevokePreviewUrl,
      };
    });
  }

  function addFiles(inputFiles: FileList | File[]) {
    const candidateFiles = Array.from(inputFiles);
    const supportedFiles: ManagedConversionFile[] = [];
    let rejectedCount = 0;

    for (const file of candidateFiles) {
      const detected = getDetectedFileInfo(file, capabilities);
      if (detected.kind === "unknown") {
        rejectedCount += 1;
        continue;
      }

      const id = crypto.randomUUID();
      const previewUrl =
        detected.kind === "image" && file.size <= MAX_PREVIEW_FILE_SIZE_BYTES
          ? URL.createObjectURL(file)
          : null;

      supportedFiles.push({
        id,
        file,
        name: file.name,
        size: file.size,
        sizeLabel: formatBytes(file.size),
        type: file.type || detected.extension.toUpperCase() || "Unknown",
        kind: detected.kind,
        extension: detected.extension,
        detailsLabel: detected.label,
        previewUrl,
        shouldRevokePreviewUrl: Boolean(previewUrl),
        naturalWidth: null,
        naturalHeight: null,
        status: "ready",
      });
    }

    if (supportedFiles.length > 0) {
      setFiles((current) => [...current, ...supportedFiles]);
    }

    if (rejectedCount > 0) {
      setMessage(
        `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped because the type is not supported.`,
      );
    } else if (supportedFiles.length > 0) {
      setMessage("");
    }

    for (const file of supportedFiles) {
      if (file.kind === "image" && file.previewUrl) {
        loadMediaDimensions("image", file.previewUrl).then(
          ({ width, height, detailsLabel }) => {
            updateFile(file.id, (currentFile) => ({
              ...currentFile,
              naturalWidth: width,
              naturalHeight: height,
              detailsLabel,
            }));
          },
        );
        continue;
      }

      if (file.kind === "video" && file.file) {
        const mediaUrl = file.previewUrl ?? URL.createObjectURL(file.file);
        const shouldRevokeMetadataUrl = mediaUrl !== file.previewUrl;

        loadMediaDimensions("video", mediaUrl).then(
          ({ width, height, detailsLabel }) => {
            if (shouldRevokeMetadataUrl) {
              URL.revokeObjectURL(mediaUrl);
            }

            updateFile(file.id, (currentFile) => ({
              ...currentFile,
              naturalWidth: width,
              naturalHeight: height,
              detailsLabel,
            }));
          },
        );
      }
    }

    return supportedFiles;
  }

  function addNativeFiles(inputFiles: NativeSelectedFile[]) {
    const supportedFiles: ManagedConversionFile[] = [];
    const nativeFileByPath = new Map(
      inputFiles.map((file) => [file.path, file]),
    );
    let rejectedCount = 0;

    for (const file of inputFiles) {
      const detected = getDetectedFileInfoFromName(
        file.name,
        file.type,
        capabilities,
      );
      if (detected.kind === "unknown") {
        rejectedCount += 1;
        continue;
      }

      supportedFiles.push({
        id: crypto.randomUUID(),
        nativePath: file.path,
        name: file.name,
        size: file.size,
        sizeLabel: formatBytes(file.size),
        type: file.type || detected.extension.toUpperCase() || "Unknown",
        kind: detected.kind,
        extension: detected.extension,
        detailsLabel: detected.label,
        previewUrl: file.previewUrl,
        shouldRevokePreviewUrl: false,
        naturalWidth: null,
        naturalHeight: null,
        status: "ready",
      });
    }

    if (supportedFiles.length > 0) {
      setFiles((current) => [...current, ...supportedFiles]);
    }

    if (rejectedCount > 0) {
      setMessage(
        `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped because the type is not supported.`,
      );
    } else if (supportedFiles.length > 0) {
      setMessage("");
    }

    for (const file of supportedFiles) {
      if (file.kind === "image" && file.previewUrl) {
        loadMediaDimensions(file.kind, file.previewUrl).then(
          ({ width, height, detailsLabel }) => {
            updateFile(file.id, (currentFile) => ({
              ...currentFile,
              naturalWidth: width,
              naturalHeight: height,
              detailsLabel,
            }));
          },
        );
      }

      if (file.kind === "video") {
        const selectedFile = file.nativePath
          ? nativeFileByPath.get(file.nativePath)
          : null;
        const mediaUrl = file.previewUrl ?? selectedFile?.metadataUrl;

        if (!mediaUrl) {
          continue;
        }

        loadMediaDimensions("video", mediaUrl).then(
          ({ width, height, detailsLabel }) => {
            updateFile(file.id, (currentFile) => ({
              ...currentFile,
              naturalWidth: width,
              naturalHeight: height,
              detailsLabel,
            }));
          },
        );
      }
    }

    return supportedFiles;
  }

  function restoreFiles(restoredFiles: ManagedConversionFile[]) {
    setFiles((current) => {
      for (const file of current) {
        if (file.previewUrl && file.shouldRevokePreviewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      }

      return restoredFiles;
    });
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const target = current.find((file) => file.id === id);
      if (target?.previewUrl && target.shouldRevokePreviewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((file) => file.id !== id);
    });
  }

  function clearAllFiles() {
    setFiles((current) => {
      for (const file of current) {
        if (file.previewUrl && file.shouldRevokePreviewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      }

      return [];
    });
    setMessage("");
  }

  function getFile(fileId: string) {
    return filesById[fileId] ?? null;
  }

  return {
    files,
    filesById,
    message,
    addFiles,
    addNativeFiles,
    clearAllFiles,
    getFile,
    removeFile,
    restoreFiles,
    setFilePreview,
    updateFileStatus,
  };
}
