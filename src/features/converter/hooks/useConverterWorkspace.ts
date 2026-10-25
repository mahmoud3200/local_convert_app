import { useEffect } from "react";
import { MAX_MEDIA_URL_FILE_SIZE_BYTES } from "@/features/converter/constants";
import { saveStoredDesktopQueue } from "@/features/converter/files/desktop-queue-storage";
import {
  getAcceptedFileTypes,
  getAllSupportedInputExtensions,
  getSupportedUploadLabels,
} from "@/features/converter/files/format-support";
import { sanitizeSettingsForKind } from "@/features/converter/settings/settings-rules";
import { useConversionProcess } from "@/features/converter/hooks/useConversionProcess";
import { useConversionSettings } from "@/features/converter/hooks/useConversionSettings";
import { useDesktopQueueHydration } from "@/features/converter/hooks/useDesktopQueueHydration";
import { useFileManager } from "@/features/converter/hooks/useFileManager";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  MediaKind,
} from "@/features/converter/types";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

export function useConverterWorkspace(platform: ConverterPlatformServices) {
  const engine = platform.engine;
  const fileManager = useFileManager(engine.capabilities);
  const settingsManager = useConversionSettings(engine.capabilities);
  const processManager = useConversionProcess({
    engine,
    files: fileManager.files,
    onStatusChange: fileManager.updateFileStatus,
    platform,
  });
  const isDesktopQueueHydrated = useDesktopQueueHydration({
    platform,
    restoreFiles: fileManager.restoreFiles,
    restoreSettings: settingsManager.restoreSettings,
  });

  useEffect(() => {
    if (!platform.usesNativeFilePicker || !isDesktopQueueHydrated) {
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
    settingsManager.registerFiles(fileManager.addFiles(inputFiles));
  }

  async function browseNativeFiles() {
    const selectedFiles = await platform.pickNativeFiles({
      extensions: getAllSupportedInputExtensions(engine.capabilities),
      previewLimitBytes: MAX_MEDIA_URL_FILE_SIZE_BYTES,
    });

    settingsManager.registerFiles(fileManager.addNativeFiles(selectedFiles));
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
    const items = getPendingConversionItems(
      fileManager.files,
      settingsManager.getSettings,
    );

    if (items.length > 0) {
      await processManager.startBatchConversion(items);
    }
  }

  function saveSettings(
    fileId: string,
    nextSettings: FileConversionSettings,
  ) {
    const file = fileManager.getFile(fileId);

    if (!file) {
      return;
    }

    settingsManager.replaceSettings(
      fileId,
      sanitizeSettingsForKind(
        file.kind,
        nextSettings,
        { width: file.naturalWidth, height: file.naturalHeight },
        engine.capabilities,
      ),
    );
    resetFileConversionState(fileId);
  }

  function saveDefaultSettings(
    kind: MediaKind,
    nextSettings: FileConversionSettings,
  ) {
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
    if (!canDownloadAll()) {
      return;
    }

    await processManager.downloadAll(fileManager.files.map((file) => file.id));
  }

  function canDownloadAll() {
    return (
      fileManager.files.length > 0 &&
      fileManager.files.every(
        (file) =>
          file.status === "done" &&
          Boolean(processManager.downloadsByFileId[file.id]),
      )
    );
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
    canConvertAll: fileManager.files.some(isPendingConversion),
    canDownloadAll: canDownloadAll(),
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

function isPendingConversion(file: ManagedConversionFile) {
  return file.status === "ready" || file.status === "error";
}

function getPendingConversionItems(
  files: ManagedConversionFile[],
  getSettings: (fileId: string) => FileConversionSettings | undefined,
) {
  return files.flatMap((file) => {
    if (!isPendingConversion(file)) {
      return [];
    }

    const settings = getSettings(file.id);

    return settings ? [{ file, settings }] : [];
  });
}
