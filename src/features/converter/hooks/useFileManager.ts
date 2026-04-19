import { useEffect, useMemo, useRef, useState } from "react";
import { formatBytes } from "@/features/converter/file-formatting";
import { getDetectedFileInfo } from "@/features/converter/format-support";
import { loadMediaDimensions } from "@/features/converter/media-metadata";
import type {
  ManagedConversionFile,
  ManagedFileStatus,
} from "@/features/converter/types";

export function useFileManager() {
  const [files, setFiles] = useState<ManagedConversionFile[]>([]);
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
        if (file.previewUrl) {
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

  function addFiles(inputFiles: FileList | File[]) {
    const candidateFiles = Array.from(inputFiles);
    const supportedFiles: ManagedConversionFile[] = [];
    let rejectedCount = 0;

    for (const file of candidateFiles) {
      const detected = getDetectedFileInfo(file);
      if (detected.kind === "unknown") {
        rejectedCount += 1;
        continue;
      }

      const id = crypto.randomUUID();
      const previewUrl =
        detected.kind === "image" ? URL.createObjectURL(file) : null;

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
        loadMediaDimensions(file.file, "image", file.previewUrl).then(
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

      if (file.kind === "video") {
        loadMediaDimensions(file.file, "video").then(
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

  function removeFile(id: string) {
    setFiles((current) => {
      const target = current.find((file) => file.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((file) => file.id !== id);
    });
  }

  function clearAllFiles() {
    setFiles((current) => {
      for (const file of current) {
        if (file.previewUrl) {
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
    clearAllFiles,
    getFile,
    removeFile,
    updateFileStatus,
  };
}
