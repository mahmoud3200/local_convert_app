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
  const cancellingFileIdsRef = useRef(new Set<string>());
  const downloadsRef = useRef<Record<string, DownloadableOutput>>({});
  const runningFileIdsRef = useRef(new Set<string>());
  const sleepPreventionActiveRef = useRef(false);
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
    const runningFileIds = runningFileIdsRef.current;

    function cancelRunningConversions() {
      for (const fileId of runningFileIds) {
        void engine.cancel(fileId).catch((error: unknown) => {
          console.warn(`Could not cancel conversion for ${fileId}:`, error);
        });
      }

      void platform.cancelAllConversions().catch((error: unknown) => {
        console.warn("Could not cancel native conversions:", error);
      });

      void platform.setSleepPrevention(false).catch((error: unknown) => {
        console.warn("Could not release sleep prevention:", error);
      });
    }

    window.addEventListener("beforeunload", cancelRunningConversions);
    window.addEventListener("pagehide", cancelRunningConversions);

    return () => {
      window.removeEventListener("beforeunload", cancelRunningConversions);
      window.removeEventListener("pagehide", cancelRunningConversions);
      cancelRunningConversions();

      for (const output of Object.values(downloadsRef.current)) {
        platform.cleanupDownloadableOutput(output);
      }
    };
  }, [engine, platform]);

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
    options: { cancelActive?: boolean; discardPending?: boolean } = {},
  ) {
    if (options.discardPending) {
      cancellingFileIdsRef.current.add(fileId);
    }

    if (options.cancelActive ?? true) {
      cancelFileConversion(fileId);
    }

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

  function cancelFileConversion(fileId: string) {
    if (!runningFileIdsRef.current.has(fileId)) {
      return;
    }

    cancellingFileIdsRef.current.add(fileId);

    void engine.cancel(fileId).catch((error: unknown) => {
      console.warn(`Could not cancel conversion for ${fileId}:`, error);
    });
  }

  function syncSleepPrevention() {
    const shouldPreventSleep = runningFileIdsRef.current.size > 0;

    if (sleepPreventionActiveRef.current === shouldPreventSleep) {
      return;
    }

    sleepPreventionActiveRef.current = shouldPreventSleep;

    void platform.setSleepPrevention(shouldPreventSleep).catch((error: unknown) => {
      console.warn("Could not update sleep prevention:", error);
    });
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
      if (
        !activeFileIdsRef.current.has(item.file.id) ||
        cancellingFileIdsRef.current.has(item.file.id)
      ) {
        continue;
      }

      await convertOne(item.file, item.settings);
    }
  }

  async function convertOne(
    file: ManagedConversionFile,
    settings: FileConversionSettings,
  ) {
    if (
      !activeFileIdsRef.current.has(file.id) ||
      cancellingFileIdsRef.current.has(file.id)
    ) {
      return;
    }

    cancellingFileIdsRef.current.delete(file.id);
    clearFileProcess(file.id, "ready", { cancelActive: false });
    runningFileIdsRef.current.add(file.id);
    syncSleepPrevention();
    onStatusChange(file.id, "converting");

    try {
      const result = await engine.convert(createConvertRequest(file, settings));

      if (
        !activeFileIdsRef.current.has(file.id) ||
        cancellingFileIdsRef.current.has(file.id)
      ) {
        return;
      }

      const output = platform.createDownloadableOutput(result);

      setStoredDownloadsByFileId((current) => ({
        ...current,
        [file.id]: output,
      }));
      onStatusChange(file.id, "done");
      notifyConversionComplete(platform, file, output);
    } catch (error) {
      console.error(error);

      if (
        activeFileIdsRef.current.has(file.id) &&
        !cancellingFileIdsRef.current.has(file.id)
      ) {
        toast.error(getConversionErrorMessage(file, settings, error));
        onStatusChange(file.id, "error");
      }
    } finally {
      runningFileIdsRef.current.delete(file.id);
      cancellingFileIdsRef.current.delete(file.id);
      syncSleepPrevention();
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

function notifyConversionComplete(
  platform: ConverterPlatformServices,
  file: ManagedConversionFile,
  output: DownloadableOutput,
) {
  void platform
    .notifyConversionComplete({
      inputFileName: file.name,
      outputFileName: output.fileName,
    })
    .then((result) => {
      if (result.status === "failed") {
        console.warn(`Could not show desktop notification: ${result.error}`);
      }
    });
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
