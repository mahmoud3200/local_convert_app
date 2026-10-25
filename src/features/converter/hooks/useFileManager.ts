import { useEffect, useMemo, useRef, useState } from "react";
import {
  createManagedFileFromBrowserFile,
  createManagedFileFromNativeFile,
  getSkippedFilesMessage,
  loadManagedFileDimensions,
} from "@/features/converter/files/managed-files";
import type { EngineCapabilities } from "@/platform/converter/engine";
import type { NativeSelectedFile } from "@/platform/files/types";
import type {
  ManagedConversionFile,
  ManagedFileStatus,
} from "@/features/converter/types";

type VideoUrlResolver = (
  file: ManagedConversionFile,
) => { shouldRevoke: boolean; url: string } | null;

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
        revokePreviewUrl(file);
      }
    };
  }, []);

  function updateFile(
    id: string,
    updater: (file: ManagedConversionFile) => ManagedConversionFile,
  ) {
    setFiles((current) =>
      current.map((file) => (file.id === id ? updater(file) : file)),
    );
  }

  function updateFileStatus(id: string, status: ManagedFileStatus) {
    updateFile(id, (file) => ({ ...file, status }));
  }

  function addManagedFiles(
    supportedFiles: ManagedConversionFile[],
    rejectedCount: number,
    resolveVideoUrl: VideoUrlResolver,
  ) {
    if (supportedFiles.length > 0) {
      setFiles((current) => [...current, ...supportedFiles]);
    }

    if (rejectedCount > 0) {
      setMessage(getSkippedFilesMessage(rejectedCount));
    } else if (supportedFiles.length > 0) {
      setMessage("");
    }

    for (const file of supportedFiles) {
      void loadManagedFileDimensions(file, () => resolveVideoUrl(file)).then(
        (dimensions) => {
          if (!dimensions) {
            return;
          }

          updateFile(file.id, (currentFile) => ({
            ...currentFile,
            ...dimensions,
          }));
        },
      );
    }

    return supportedFiles;
  }

  function addFiles(inputFiles: FileList | File[]) {
    const candidateFiles = Array.from(inputFiles);
    const supportedFiles = candidateFiles.flatMap((file) => {
      const managedFile = createManagedFileFromBrowserFile(file, capabilities);
      return managedFile ? [managedFile] : [];
    });

    return addManagedFiles(
      supportedFiles,
      candidateFiles.length - supportedFiles.length,
      (file) =>
        file.file
          ? { url: URL.createObjectURL(file.file), shouldRevoke: true }
          : null,
    );
  }

  function addNativeFiles(inputFiles: NativeSelectedFile[]) {
    const supportedFiles = inputFiles.flatMap((file) => {
      const managedFile = createManagedFileFromNativeFile(file, capabilities);
      return managedFile ? [managedFile] : [];
    });
    const nativeFileByPath = new Map(
      inputFiles.map((file) => [file.path, file]),
    );

    return addManagedFiles(
      supportedFiles,
      inputFiles.length - supportedFiles.length,
      (file) => {
        const nativeFile = file.nativePath
          ? nativeFileByPath.get(file.nativePath)
          : null;

        return nativeFile?.metadataUrl
          ? { url: nativeFile.metadataUrl, shouldRevoke: false }
          : null;
      },
    );
  }

  function restoreFiles(restoredFiles: ManagedConversionFile[]) {
    setFiles((current) => {
      for (const file of current) {
        revokePreviewUrl(file);
      }

      return restoredFiles;
    });
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const target = current.find((file) => file.id === id);

      if (target) {
        revokePreviewUrl(target);
      }

      return current.filter((file) => file.id !== id);
    });
  }

  function clearAllFiles() {
    setFiles((current) => {
      for (const file of current) {
        revokePreviewUrl(file);
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
    updateFileStatus,
  };
}

function revokePreviewUrl(file: ManagedConversionFile) {
  if (file.previewUrl && file.shouldRevokePreviewUrl) {
    URL.revokeObjectURL(file.previewUrl);
  }
}
