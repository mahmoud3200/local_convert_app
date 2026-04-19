import type { ConvertRequest } from "@/platform/converter/engine";
import type {
  AdvancedSettings,
  FileConversionSettings,
  ManagedConversionFile,
} from "./types";

export function createConvertRequest(
  file: ManagedConversionFile,
  settings: FileConversionSettings,
): ConvertRequest {
  return {
    file: file.file,
    kind: file.kind,
    outputFormat: settings.format,
    options: {
      ...getSizeOptions(file, settings.advanced),
      bitrate:
        settings.advanced.bitrate === null
          ? undefined
          : String(settings.advanced.bitrate),
      channels: settings.advanced.channels ?? undefined,
      fps: settings.advanced.frameRate ?? undefined,
      quality: settings.advanced.quality,
      removeMetadata: settings.advanced.removeMetadata,
      sampleRate: settings.advanced.sampleRate ?? undefined,
    },
  };
}

function getSizeOptions(
  file: ManagedConversionFile,
  advanced: AdvancedSettings,
) {
  if (advanced.resolution === "custom") {
    return {
      width:
        typeof advanced.customWidth === "number"
          ? advanced.customWidth
          : undefined,
      height:
        typeof advanced.customHeight === "number"
          ? advanced.customHeight
          : undefined,
    };
  }

  if (advanced.resolution === "2x" && file.naturalWidth && file.naturalHeight) {
    return {
      width: file.naturalWidth * 2,
      height: file.naturalHeight * 2,
    };
  }

  if (advanced.resolution === "1080p") {
    return { height: 1080 };
  }

  if (advanced.resolution === "720p") {
    return { height: 720 };
  }

  return {};
}
