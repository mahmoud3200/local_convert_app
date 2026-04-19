import {
  getDefaultOutputFormatForKind,
  isOutputFormatValidForKind,
} from "./format-support";
import { createDefaultFileSettings } from "./presets";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
} from "./types";
import type { EngineCapabilities } from "@/platform/converter/engine";

const QUALITY_RANGE = { min: 1, max: 100 };
const COMPRESSION_RANGE = { min: 0, max: 9 };
const DIMENSION_RANGE = { min: 1, max: 16384 };
const FRAME_RATE_RANGE = { min: 1, max: 240 };
const AUDIO_BITRATE_RANGE = { min: 8, max: 512 };
const VIDEO_BITRATE_RANGE = { min: 1, max: 200 };
const VALID_SAMPLE_RATES = new Set([32000, 44100, 48000]);

const allowedAdvancedSettingsByKind: Record<MediaKind, Array<keyof AdvancedSettings>> = {
  image: [
    "quality",
    "compression",
    "resolution",
    "customWidth",
    "customHeight",
    "removeMetadata",
  ],
  video: [
    "quality",
    "bitrate",
    "frameRate",
    "resolution",
    "customWidth",
    "customHeight",
    "removeMetadata",
  ],
  audio: [
    "quality",
    "bitrate",
    "sampleRate",
    "channels",
    "removeMetadata",
  ],
};

export function isAdvancedSettingAllowedForKind(
  kind: MediaKind,
  key: keyof AdvancedSettings,
) {
  return allowedAdvancedSettingsByKind[kind].includes(key);
}

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
  applyCapabilityLimits(kind, advanced, capabilities);

  return {
    format,
    preset: hasPresetControlsForKind(kind, capabilities) ? settings.preset : null,
    advanced,
  };
}

function clampAdvancedValues(
  kind: MediaKind,
  advanced: AdvancedSettings,
  fallback: AdvancedSettings,
) {
  advanced.quality = clampRequiredNumber(
    advanced.quality,
    QUALITY_RANGE.min,
    QUALITY_RANGE.max,
    fallback.quality,
  );

  advanced.customWidth = clampOptionalNumber(
    advanced.customWidth,
    DIMENSION_RANGE.min,
    DIMENSION_RANGE.max,
  );
  advanced.customHeight = clampOptionalNumber(
    advanced.customHeight,
    DIMENSION_RANGE.min,
    DIMENSION_RANGE.max,
  );

  if (advanced.compression !== null) {
    advanced.compression = clampRequiredNumber(
      advanced.compression,
      COMPRESSION_RANGE.min,
      COMPRESSION_RANGE.max,
      fallback.compression ?? COMPRESSION_RANGE.max,
    );
  }

  if (advanced.frameRate !== null) {
    advanced.frameRate = clampRequiredNumber(
      advanced.frameRate,
      FRAME_RATE_RANGE.min,
      FRAME_RATE_RANGE.max,
      FRAME_RATE_RANGE.max,
    );
  }

  if (advanced.bitrate !== null) {
    const range = kind === "audio" ? AUDIO_BITRATE_RANGE : VIDEO_BITRATE_RANGE;
    advanced.bitrate = clampRequiredNumber(
      advanced.bitrate,
      range.min,
      range.max,
      fallback.bitrate ?? range.min,
    );
  }

  if (!VALID_SAMPLE_RATES.has(Number(advanced.sampleRate))) {
    advanced.sampleRate = null;
  }

  if (advanced.channels !== 1 && advanced.channels !== 2) {
    advanced.channels = null;
  }
}

function clampRequiredNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), min), max);
}

function clampOptionalNumber(value: unknown, min: number, max: number) {
  if (value === "") {
    return "";
  }

  return clampRequiredNumber(value, min, max, min);
}

export function hasPresetControlsForKind(
  kind: MediaKind,
  capabilities?: EngineCapabilities,
) {
  const settingCapabilities = capabilities?.advancedSettings[kind];

  if (!settingCapabilities) {
    return true;
  }

  return Boolean(
    settingCapabilities.quality ||
      settingCapabilities.compression ||
      settingCapabilities.resolution ||
      settingCapabilities.bitrate ||
      settingCapabilities.frameRate ||
      settingCapabilities.sampleRate ||
      settingCapabilities.channels,
  );
}

function applyCapabilityLimits(
  kind: MediaKind,
  advanced: AdvancedSettings,
  capabilities?: EngineCapabilities,
) {
  const settingCapabilities = capabilities?.advancedSettings[kind];

  if (!settingCapabilities) {
    return;
  }

  if (!settingCapabilities.quality) {
    advanced.quality = createDefaultFileSettings(kind).advanced.quality;
  }

  if (!settingCapabilities.compression) {
    advanced.compression = null;
  }

  if (!settingCapabilities.resolution) {
    advanced.resolution = "original";
    advanced.customWidth = "";
    advanced.customHeight = "";
  }

  if (!settingCapabilities.bitrate) {
    advanced.bitrate = null;
  }

  if (!settingCapabilities.frameRate) {
    advanced.frameRate = null;
  }

  if (!settingCapabilities.sampleRate) {
    advanced.sampleRate = null;
  }

  if (!settingCapabilities.channels) {
    advanced.channels = null;
  }
}
