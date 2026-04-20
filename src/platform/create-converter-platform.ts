import type { ConverterPlatformServices } from "@/platform/converter-platform";
import { createConverterEngine } from "@/platform/converter/create-engine";
import { pickNativeFiles } from "@/platform/files/tauri-file-picker";
import {
  saveDownloadableOutput,
  saveDownloadableOutputsAsZip,
} from "@/platform/output/download-output";
import {
  cleanupDownloadableOutput,
  createDownloadableOutput,
} from "@/platform/output/web-output";
import { isTauriRuntime } from "@/platform/tauri-runtime";

export function createConverterPlatform(): ConverterPlatformServices {
  return {
    cleanupDownloadableOutput,
    createDownloadableOutput,
    engine: createConverterEngine(),
    pickNativeFiles: ({ extensions, previewLimitBytes }) =>
      pickNativeFiles(extensions, previewLimitBytes),
    saveDownloadableOutput,
    saveDownloadableOutputsAsZip,
    usesNativeFilePicker: isTauriRuntime(),
  };
}
