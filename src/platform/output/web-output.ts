import type { ConvertResult } from "@/platform/converter/engine";
import type { DownloadableOutput } from "./types";

export function createDownloadableOutput(result: ConvertResult): DownloadableOutput {
  const output: DownloadableOutput = {
    blob: result.blob,
    fileName: result.fileName,
    mimeType: result.mimeType,
    nativePath: result.nativePath,
  };

  if (result.blob) {
    output.objectUrl = URL.createObjectURL(result.blob);
  }

  return output;
}

export function cleanupDownloadableOutput(output: DownloadableOutput) {
  if (output.objectUrl) {
    URL.revokeObjectURL(output.objectUrl);
  }

  if (output.nativePath) {
    void cleanupNativeGeneratedOutput(output.nativePath);
  }
}

export function triggerBrowserDownload(output: DownloadableOutput) {
  if (!output.objectUrl) {
    throw new Error("This output is not available as a browser download URL.");
  }

  const link = document.createElement("a");
  link.href = output.objectUrl;
  link.download = output.fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

async function cleanupNativeGeneratedOutput(nativePath: string) {
  const { isTauriRuntime } = await import("@/platform/tauri-runtime");
  if (!isTauriRuntime()) {
    return;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("delete_generated_output", { path: nativePath }).catch(() => {
    // Temporary conversion files should not block UI cleanup if removal fails.
  });
}
