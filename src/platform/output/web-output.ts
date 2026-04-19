import type { ConvertResult } from "@/platform/converter/engine";
import type { DownloadableOutput } from "@/features/converter/types";

export function createDownloadableOutput(result: ConvertResult): DownloadableOutput {
  return {
    blob: result.blob,
    fileName: result.fileName,
    mimeType: result.mimeType,
    objectUrl: URL.createObjectURL(result.blob),
  };
}

export function revokeBrowserDownload(output: DownloadableOutput) {
  URL.revokeObjectURL(output.objectUrl);
}

export function triggerBrowserDownload(output: DownloadableOutput) {
  const link = document.createElement("a");
  link.href = output.objectUrl;
  link.download = output.fileName;
  document.body.append(link);
  link.click();
  link.remove();
}
