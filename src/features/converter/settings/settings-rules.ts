import { createDefaultFileSettings } from "./defaults";
import { applyCapabilityLimits, clampAdvancedValues } from "./settings-clamping";
import {
  getDefaultOutputFormatForKind,
  isOutputFormatValidForKind,
} from "../files/format-support";
import type { AdvancedSettings, FileConversionSettings, MediaKind } from "../types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export function sanitizeSettingsForKind(
  kind: MediaKind,
  settings: FileConversionSettings,
  naturalSize?: { width: number | null; height: number | null },
  capabilities?: EngineCapabilities,
): FileConversionSettings {
  const fallback = createDefaultFileSettings(kind);
  const format = isOutputFormatValidForKind(kind, settings.format, capabilities)
    ? settings.format
    : getDefaultOutputFormatForKind(kind, capabilities) ?? fallback.format;
  const advanced: AdvancedSettings = {
    ...fallback.advanced,
    ...settings.advanced,
  };

  if (advanced.resolution !== "custom") {
    advanced.customWidth = "";
    advanced.customHeight = "";
  } else {
    if (advanced.customWidth === "" && naturalSize?.width) {
      advanced.customWidth = naturalSize.width;
    }

    if (advanced.customHeight === "" && naturalSize?.height) {
      advanced.customHeight = naturalSize.height;
    }
  }

  if (kind === "image") {
    advanced.compression ??= fallback.advanced.compression;
    advanced.bitrate = null;
    advanced.frameRate = null;
    advanced.sampleRate = null;
    advanced.channels = null;
  } else if (kind === "video") {
    advanced.compression = null;
    advanced.sampleRate = null;
    advanced.channels = null;
  } else {
    advanced.compression = null;
    advanced.resolution = "original";
    advanced.customWidth = "";
    advanced.customHeight = "";
    advanced.frameRate = null;
  }

  clampAdvancedValues(kind, advanced, fallback.advanced);
  applyCapabilityLimits(kind, advanced, fallback.advanced, capabilities);

  return {
    format,
    advanced,
  };
}
