import { isTauriRuntime } from "@/platform/tauri-runtime";
import type { DownloadableOutput, SaveOutputResult } from "./types";
import {
  saveNativeOutputsAsZipWithDialog,
  saveWithNativeDialog,
} from "./tauri-output";
import { triggerBrowserDownload } from "./web-output";
import { createZipBlob } from "./zip-output";

export async function saveDownloadableOutput(
  output: DownloadableOutput,
): Promise<SaveOutputResult> {
  if (isTauriRuntime()) {
    const saved = await saveWithNativeDialog(output);
    return {
      status: saved ? "saved" : "cancelled",
      target: "desktop-file",
    };
  }

  triggerBrowserDownload(output);
  return {
    status: "saved",
    target: "browser-download",
  };
}

export async function saveDownloadableOutputsAsZip(
  outputs: DownloadableOutput[],
): Promise<SaveOutputResult> {
  if (isTauriRuntime() && outputs.every((output) => output.nativePath)) {
    const saved = await saveNativeOutputsAsZipWithDialog(outputs);
    return {
      status: saved ? "saved" : "cancelled",
      target: "desktop-file",
    };
  }

  const blob = await createZipBlob(outputs);
  const zipOutput = {
    blob,
    fileName: "local-convert-results.zip",
    mimeType: "application/zip",
    objectUrl: URL.createObjectURL(blob),
  };

  try {
    return await saveDownloadableOutput(zipOutput);
  } finally {
    URL.revokeObjectURL(zipOutput.objectUrl);
  }
}
