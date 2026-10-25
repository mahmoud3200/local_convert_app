import { RESOLUTION_OPTIONS } from "@/features/converter/constants";
import type { MediaKind } from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export function getSettingsVisibility(
  kind: MediaKind,
  capabilities?: EngineCapabilities,
) {
  const settingsCapabilities = capabilities?.advancedSettings[kind];
  const canShowResolution =
    settingsCapabilities?.resolution ?? (kind === "image" || kind === "video");

  return {
    canShowQuality:
      kind !== "audio" && (settingsCapabilities?.quality ?? true),
    canShowCompression:
      kind === "image" && (settingsCapabilities?.compression ?? true),
    canShowResolutionCards:
      canShowResolution && RESOLUTION_OPTIONS[kind].length > 0,
    canShowBitrate:
      settingsCapabilities?.bitrate ?? (kind === "audio" || kind === "video"),
    canShowFrameRate: settingsCapabilities?.frameRate ?? kind === "video",
    canShowSampleRate: settingsCapabilities?.sampleRate ?? kind === "audio",
    canShowChannels: settingsCapabilities?.channels ?? kind === "audio",
    canShowMetadata: settingsCapabilities?.metadata ?? true,
    isBrowserVideo:
      kind === "video" && capabilities?.runtime === "web-wasm",
  };
}

export type SettingsVisibility = ReturnType<typeof getSettingsVisibility>;
