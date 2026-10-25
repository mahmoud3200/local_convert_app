import {
  AUDIO_BITRATE_RANGE,
  COMPRESSION_RANGE,
  DIMENSION_RANGE,
  FRAME_RATE_RANGE,
  QUALITY_RANGE,
  VALID_SAMPLE_RATES,
  VIDEO_BITRATE_RANGE,
} from "../constants";
import type { AdvancedSettings, MediaKind } from "../types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export function clampAdvancedValues(
  kind: MediaKind,
  advanced: AdvancedSettings,
  fallback: AdvancedSettings,
) {
  advanced.quality = clampRequiredNumber(
    advanced.quality,
    QUALITY_RANGE,
    fallback.quality,
  );

  advanced.customWidth = clampOptionalNumber(
    advanced.customWidth,
    DIMENSION_RANGE,
  );
  advanced.customHeight = clampOptionalNumber(
    advanced.customHeight,
    DIMENSION_RANGE,
  );

  if (advanced.compression !== null) {
    advanced.compression = clampRequiredNumber(
      advanced.compression,
      COMPRESSION_RANGE,
      fallback.compression ?? COMPRESSION_RANGE.max,
    );
  }

  if (advanced.frameRate !== null) {
    advanced.frameRate = clampRequiredNumber(
      advanced.frameRate,
      FRAME_RATE_RANGE,
      FRAME_RATE_RANGE.max,
    );
  }

  if (advanced.bitrate !== null) {
    const range = kind === "audio" ? AUDIO_BITRATE_RANGE : VIDEO_BITRATE_RANGE;
    advanced.bitrate = clampRequiredNumber(
      advanced.bitrate,
      range,
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

export function applyCapabilityLimits(
  kind: MediaKind,
  advanced: AdvancedSettings,
  fallback: AdvancedSettings,
  capabilities?: EngineCapabilities,
) {
  const settingCapabilities = capabilities?.advancedSettings[kind];

  if (!settingCapabilities) {
    return;
  }

  if (!settingCapabilities.quality) {
    advanced.quality = fallback.quality;
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

function clampRequiredNumber(
  value: unknown,
  range: { min: number; max: number },
  fallback: number,
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(numericValue), range.min), range.max);
}

function clampOptionalNumber(
  value: unknown,
  range: { min: number; max: number },
) {
  if (value === "") {
    return "";
  }

  return clampRequiredNumber(value, range, range.min);
}
