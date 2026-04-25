import { useEffect, useState } from "react";
import { MAX_PREVIEW_FILE_SIZE_BYTES } from "@/features/converter/constants";
import {
  loadStoredDesktopQueue,
  saveStoredDesktopQueue,
} from "@/features/converter/desktop-queue-storage";
import {
  getAcceptedFileTypes,
  getAllSupportedInputExtensions,
  getSupportedUploadLabels,
} from "@/features/converter/format-support";
import { sanitizeSettingsForKind } from "@/features/converter/settings-rules";
import { useConversionProcess } from "@/features/converter/hooks/useConversionProcess";
import { useConversionSettings } from "@/features/converter/hooks/useConversionSettings";
import { useFileManager } from "@/features/converter/hooks/useFileManager";
import type {
  FileConversionSettings,
  MediaKind,
} from "@/features/converter/types";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

export function useConverterWorkspace(platform: ConverterPlatformServices) {
  const engine = platform.engine;
  const [isDesktopQueueHydrated, setIsDesktopQueueHydrated] = useState(
    !platform.usesNativeFilePicker,
  );
  const fileManager = useFileManager(engine.capabilities);
  const settingsManager = useConversionSettings(engine.capabilities);
  const processManager = useConversionProcess({
    engine,
    files: fileManager.files,
    onStatusChange: fileManager.updateFileStatus,
    platform,
  });

  useEffect(() => {
    if (!platform.usesNativeFilePicker || isDesktopQueueHydrated) {
      return;
    }

    let cancelled = false;

    async function hydrateDesktopQueue() {
      const restoredQueue = loadStoredDesktopQueue(engine.capabilities);
      const existingPaths = await platform.getExistingNativePaths(
        restoredQueue.files
          .map((file) => file.nativePath)
          .filter((path): path is string => Boolean(path)),
      );

      if (cancelled) {
        return;
      }

      const files = restoredQueue.files.filter(
        (file) => file.nativePath && existingPaths.has(file.nativePath),
      );
      const fileIds = new Set(files.map((file) => file.id));
      const settingsByFileId = Object.fromEntries(
        Object.entries(restoredQueue.settingsByFileId).filter(([fileId]) =>
          fileIds.has(fileId),
        ),
      );

      fileManager.restoreFiles(files);
      settingsManager.restoreSettings(settingsByFileId);
      setIsDesktopQueueHydrated(true);
    }

    void hydrateDesktopQueue().catch((error: unknown) => {
      console.warn("Could not restore the desktop queue:", error);

      if (!cancelled) {
        setIsDesktopQueueHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    engine.capabilities,
    fileManager,
    isDesktopQueueHydrated,
    platform,
    settingsManager,
  ]);

  useEffect(() => {
    if (!platform.usesNativeFilePicker) {
      return;
    }

    if (!isDesktopQueueHydrated) {
      return;
    }

    saveStoredDesktopQueue(
      fileManager.files,
      settingsManager.settingsByFileId,
    );
  }, [
    fileManager.files,
    isDesktopQueueHydrated,
    platform.usesNativeFilePicker,
    settingsManager.settingsByFileId,
  ]);

  function addFiles(inputFiles: FileList | File[]) {
    const newFiles = fileManager.addFiles(inputFiles);
    settingsManager.registerFiles(newFiles);
  }

  async function browseNativeFiles() {
    const selectedFiles = await platform.pickNativeFiles({
      extensions: getAllSupportedInputExtensions(engine.capabilities),
      previewLimitBytes: MAX_PREVIEW_FILE_SIZE_BYTES,
    });
    const newFiles = fileManager.addNativeFiles(selectedFiles);
    settingsManager.registerFiles(newFiles);
  }

  function resetFileConversionState(
    fileId: string,
    options?: { discardPending?: boolean },
  ) {
    processManager.clearFileProcess(fileId, "ready", options);
  }

  async function convert(fileId: string) {
    const file = fileManager.getFile(fileId);
    const settings = settingsManager.getSettings(fileId);
    if (!file || !settings) {
      return;
    }

    await processManager.startConversion(file, settings);
  }

  async function convertAll() {
    const items = fileManager.files
      .filter((file) => file.status === "ready" || file.status === "error")
      .map((file) => ({
        file,
        settings: settingsManager.getSettings(file.id),
      }))
      .filter(
        (
          item,
        ): item is {
          file: typeof item.file;
          settings: NonNullable<typeof item.settings>;
        } => Boolean(item.settings),
      );

    if (items.length === 0) {
      return;
    }

    await processManager.startBatchConversion(items);
  }

  function saveSettings(fileId: string, nextSettings: FileConversionSettings) {
    const file = fileManager.getFile(fileId);
    if (!file) {
      return;
    }

    settingsManager.replaceSettings(
      fileId,
      sanitizeSettingsForKind(
        file.kind,
        nextSettings,
        {
          width: file.naturalWidth,
          height: file.naturalHeight,
        },
        engine.capabilities,
      ),
    );
    resetFileConversionState(fileId);
  }

  function saveDefaultSettings(kind: MediaKind, nextSettings: FileConversionSettings) {
    settingsManager.replaceDefaultSettings(
      kind,
      sanitizeSettingsForKind(
        kind,
        nextSettings,
        undefined,
        engine.capabilities,
      ),
    );
  }

  function remove(fileId: string) {
    resetFileConversionState(fileId, { discardPending: true });
    settingsManager.removeSettings(fileId);
    fileManager.removeFile(fileId);
  }

  function clearAll() {
    for (const file of fileManager.files) {
      resetFileConversionState(file.id, { discardPending: true });
    }

    settingsManager.clearSettings();
    fileManager.clearAllFiles();
  }

  async function download(fileId: string) {
    await processManager.download(fileId);
  }

  async function downloadAll() {
    const allDone =
      fileManager.files.length > 0 &&
      fileManager.files.every(
        (file) => file.status === "done" && processManager.downloadsByFileId[file.id],
      );

    if (!allDone) {
      return;
    }

    await processManager.downloadAll(fileManager.files.map((file) => file.id));
  }

  return {
    acceptedFileTypes: getAcceptedFileTypes(engine.capabilities),
    capabilities: engine.capabilities,
    defaultSettingsByKind: settingsManager.defaultSettingsByKind,
    files: fileManager.files,
    getFile: fileManager.getFile,
    getSettings: settingsManager.getSettings,
    message: fileManager.message,
    downloadsByFileId: processManager.downloadsByFileId,
    settingsByFileId: settingsManager.settingsByFileId,
    supportedUploadLabels: getSupportedUploadLabels(engine.capabilities),
    usesNativeFilePicker: platform.usesNativeFilePicker,
    canConvertAll: fileManager.files.some(
      (file) => file.status === "ready" || file.status === "error",
    ),
    canDownloadAll:
      fileManager.files.length > 0 &&
      fileManager.files.every(
        (file) => file.status === "done" && processManager.downloadsByFileId[file.id],
      ),
    actions: {
      addFiles,
      browseNativeFiles,
      clearAll,
      convert,
      convertAll,
      download,
      downloadAll,
      remove,
      saveSettings,
      saveDefaultSettings,
    },
  };
}
