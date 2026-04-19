import type { FileConversionSettings, MediaKind } from "./types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export function buildSettingsSummary(
  kind: MediaKind,
  settings: FileConversionSettings,
  capabilities?: EngineCapabilities,
) {
  const parts = [`Output ${settings.format.toUpperCase()}`];
  const settingCapabilities = capabilities?.advancedSettings[kind];
  const canShowQuality = settingCapabilities?.quality ?? true;
  const canShowResolution = settingCapabilities?.resolution ?? true;
  const canShowBitrate = settingCapabilities?.bitrate ?? true;
  const canShowFrameRate = settingCapabilities?.frameRate ?? true;
  const canShowSampleRate = settingCapabilities?.sampleRate ?? true;
  const canShowChannels = settingCapabilities?.channels ?? true;

  if (kind === "image") {
    if (canShowQuality) {
      parts.push(`Quality ${settings.advanced.quality}`);
    }

    if (settings.advanced.compression !== null) {
      parts.push(`Compression ${settings.advanced.compression}`);
    }

    if (!canShowResolution) {
      return finishSummary(parts, settings);
    }

    if (settings.advanced.resolution === "custom") {
      const width = settings.advanced.customWidth || "Auto";
      const height = settings.advanced.customHeight || "Auto";
      parts.push(`${width} x ${height}`);
    } else {
      parts.push(`Size ${settings.advanced.resolution}`);
    }
  }

  if (kind === "video") {
    if (canShowQuality) {
      parts.push(`Quality ${settings.advanced.quality}`);
    }

    if (canShowBitrate && settings.advanced.bitrate !== null) {
      parts.push(`Bitrate ${settings.advanced.bitrate} Mbps`);
    }

    if (canShowFrameRate && settings.advanced.frameRate !== null) {
      parts.push(`${settings.advanced.frameRate} fps`);
    }

    if (!canShowResolution) {
      return finishSummary(parts, settings);
    }

    if (settings.advanced.resolution === "custom") {
      const width = settings.advanced.customWidth || "Auto";
      const height = settings.advanced.customHeight || "Auto";
      parts.push(`${width} x ${height}`);
    } else {
      parts.push(`Size ${settings.advanced.resolution}`);
    }
  }

  if (kind === "audio") {
    if (canShowQuality) {
      parts.push(`Quality ${settings.advanced.quality}`);
    }

    if (canShowBitrate && settings.advanced.bitrate !== null) {
      parts.push(`Bitrate ${settings.advanced.bitrate} kbps`);
    }

    if (canShowSampleRate && settings.advanced.sampleRate !== null) {
      parts.push(`${settings.advanced.sampleRate} Hz`);
    }

    if (canShowChannels && settings.advanced.channels !== null) {
      parts.push(settings.advanced.channels === 1 ? "Mono" : "Stereo");
    }
  }

  return finishSummary(parts, settings);
}

function finishSummary(parts: string[], settings: FileConversionSettings) {
  if (settings.advanced.removeMetadata) {
    parts.push("Metadata stripped");
  }

  return parts.join(" | ");
}
