import type { ConverterPlatformServices } from "@/platform/converter-platform";
import { cancelAllConversions } from "@/platform/converter/cancel-all-conversions";
import { createConverterEngine } from "@/platform/converter/create-engine";
import { getExistingNativePaths } from "@/platform/files/tauri-file-picker";
import { pickNativeFiles } from "@/platform/files/tauri-file-picker";
import {
  saveDownloadableOutput,
  saveDownloadableOutputsAsZip,
} from "@/platform/output/download-output";
import {
  cleanupDownloadableOutput,
  createDownloadableOutput,
} from "@/platform/output/web-output";
import { notifyConversionComplete } from "@/platform/notifications/conversion-notifications";
import { openExternalUrl } from "@/platform/open-external-url";
import { setSleepPrevention } from "@/platform/power/sleep-prevention";
import { isTauriRuntime } from "@/platform/tauri-runtime";

export function createConverterPlatform(): ConverterPlatformServices {
  return {
    cancelAllConversions,
    cleanupDownloadableOutput,
    createDownloadableOutput,
    engine: createConverterEngine(),
    getExistingNativePaths,
    notifyConversionComplete,
    openExternalUrl,
    pickNativeFiles: ({ extensions, previewLimitBytes }) =>
      pickNativeFiles(extensions, previewLimitBytes),
    saveDownloadableOutput,
    saveDownloadableOutputsAsZip,
    setSleepPrevention,
    usesNativeFilePicker: isTauriRuntime(),
  };
}
