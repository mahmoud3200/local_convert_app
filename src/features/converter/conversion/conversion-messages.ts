import type { ConverterPlatformServices } from "@/platform/converter-platform";
import type { DownloadableOutput } from "@/platform/output/types";
import type {
  FileConversionSettings,
  ManagedConversionFile,
} from "../types";

export function notifyConversionComplete(
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

export function getConversionErrorMessage(
  file: ManagedConversionFile,
  settings: FileConversionSettings,
  error: unknown,
) {
  return `Could not convert ${file.name} to ${settings.format.toUpperCase()}. ${getErrorDetail(error)}`;
}

export function getDownloadSuccessMessage(
  fileName: string,
  target: "browser-download" | "desktop-file",
) {
  return target === "desktop-file"
    ? `Saved ${fileName}.`
    : `Downloaded ${fileName}.`;
}

export function getDownloadErrorMessage(fileName: string, error: unknown) {
  return `Could not save ${fileName}. ${getErrorDetail(error)}`;
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
