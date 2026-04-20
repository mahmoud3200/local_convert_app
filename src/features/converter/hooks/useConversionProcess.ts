import { useEffect, useMemo, useRef, useState } from "react";
import { createConvertRequest } from "@/features/converter/conversion-request";
import { useToast } from "@/hooks/useToast";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  ManagedFileStatus,
} from "@/features/converter/types";
import type { ConverterEngine } from "@/platform/converter/engine";
import type { DownloadableOutput } from "@/platform/output/types";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

interface UseConversionProcessOptions {
  engine: ConverterEngine;
  files: ManagedConversionFile[];
  onStatusChange: (fileId: string, status: ManagedFileStatus) => void;
  platform: ConverterPlatformServices;
}

export function useConversionProcess({
  engine,
  files,
  onStatusChange,
  platform,
}: UseConversionProcessOptions) {
  const toast = useToast();
  const activeFileIdsRef = useRef(new Set(files.map((file) => file.id)));
  const downloadsRef = useRef<Record<string, DownloadableOutput>>({});
  const [storedDownloadsByFileId, setStoredDownloadsByFileId] = useState<
    Record<string, DownloadableOutput>
  >({});

  useEffect(() => {
    activeFileIdsRef.current = new Set(files.map((file) => file.id));
  }, [files]);

  useEffect(() => {
    downloadsRef.current = storedDownloadsByFileId;
  }, [storedDownloadsByFileId]);

  useEffect(() => {
    return () => {
      for (const output of Object.values(downloadsRef.current)) {
        platform.cleanupDownloadableOutput(output);
      }
    };
  }, [platform]);

  const activeIds = useMemo(() => new Set(files.map((file) => file.id)), [files]);

  const downloadsByFileId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(storedDownloadsByFileId).filter(([fileId]) => activeIds.has(fileId)),
      ),
    [activeIds, storedDownloadsByFileId],
  );

  function clearFileProcess(
    fileId: string,
    nextStatus: ManagedFileStatus = "ready",
  ) {
    setStoredDownloadsByFileId((current) => {
      const next = { ...current };
      const existing = next[fileId];

      if (existing) {
        platform.cleanupDownloadableOutput(existing);
      }

      delete next[fileId];
      return next;
    });

    onStatusChange(fileId, nextStatus);
  }

  async function startConversion(
    file: ManagedConversionFile,
    settings: FileConversionSettings,
  ) {
    await convertOne(file, settings);
  }

  async function startBatchConversion(
    items: Array<{ file: ManagedConversionFile; settings: FileConversionSettings }>,
  ) {
    for (const item of items) {
      await convertOne(item.file, item.settings);
    }
  }

  async function convertOne(
    file: ManagedConversionFile,
    settings: FileConversionSettings,
  ) {
    clearFileProcess(file.id, "ready");
    onStatusChange(file.id, "converting");

    try {
      const result = await engine.convert(createConvertRequest(file, settings));

      if (!activeFileIdsRef.current.has(file.id)) {
        return;
      }

      setStoredDownloadsByFileId((current) => ({
        ...current,
        [file.id]: platform.createDownloadableOutput(result),
      }));
      onStatusChange(file.id, "done");
    } catch (error) {
      console.error(error);

      if (activeFileIdsRef.current.has(file.id)) {
        toast.error(getConversionErrorMessage(file, settings, error));
        onStatusChange(file.id, "error");
      }
    }
  }

  async function download(fileId: string) {
    const output = downloadsByFileId[fileId];
    if (!output) {
      return;
    }

    try {
      const result = await platform.saveDownloadableOutput(output);

      if (result.status === "saved") {
        toast.success(getDownloadSuccessMessage(output.fileName, result.target));
      }
    } catch (error) {
      console.error(error);
      toast.error(getDownloadErrorMessage(output.fileName, error));
    }
  }

  async function downloadAll(fileIds: string[]) {
    const outputs = fileIds
      .map((fileId) => downloadsByFileId[fileId])
      .filter((output): output is DownloadableOutput => Boolean(output));

    if (outputs.length !== fileIds.length) {
      return;
    }

    try {
      const result = await platform.saveDownloadableOutputsAsZip(outputs);

      if (result.status === "saved") {
        toast.success(getDownloadSuccessMessage("local-convert-results.zip", result.target));
      }
    } catch (error) {
      console.error(error);
      toast.error(getDownloadErrorMessage("local-convert-results.zip", error));
    }
  }

  return {
    clearFileProcess,
    downloadsByFileId,
    download,
    downloadAll,
    startBatchConversion,
    startConversion,
  };
}

function getConversionErrorMessage(
  file: ManagedConversionFile,
  settings: FileConversionSettings,
  error: unknown,
) {
  const detail = getErrorDetail(error);

  return `Could not convert ${file.name} to ${settings.format.toUpperCase()}. ${detail}`;
}

function getErrorDetail(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return "The converter returned an unknown error.";
}

function getDownloadSuccessMessage(
  fileName: string,
  target: "browser-download" | "desktop-file",
) {
  return target === "desktop-file"
    ? `Saved ${fileName}.`
    : `Downloaded ${fileName}.`;
}

function getDownloadErrorMessage(fileName: string, error: unknown) {
  return `Could not save ${fileName}. ${getErrorDetail(error)}`;
}
