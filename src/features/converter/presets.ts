import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
  QualityPreset,
  SelectOptionValue,
} from "./types";

export const IMAGE_PRESET_OPTIONS: SelectOptionValue<QualityPreset>[] = [
  { label: "High", value: "high", description: "Best quality, larger output." },
  {
    label: "Balanced",
    value: "balanced",
    description: "Good default for most files.",
  },
  {
    label: "Smallest",
    value: "smallest",
    description: "More compression, lighter output.",
  },
];

export const AUDIO_PRESET_OPTIONS: SelectOptionValue<QualityPreset>[] = [
  { label: "High", value: "high", description: "Higher bitrate and cleaner output." },
  { label: "Balanced", value: "balanced", description: "Good default for most exports." },
  { label: "Smallest", value: "smallest", description: "Smaller output for easy sharing." },
];

export const VIDEO_PRESET_OPTIONS: SelectOptionValue<QualityPreset>[] = [
  { label: "High", value: "high", description: "Sharper output with larger files." },
  { label: "Balanced", value: "balanced", description: "Balanced quality and size." },
  { label: "Smallest", value: "smallest", description: "More compression for lighter exports." },
];

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  quality: 88,
  compression: null,
  resolution: "original",
  customWidth: "",
  customHeight: "",
  bitrate: null,
  frameRate: null,
  sampleRate: null,
  channels: null,
  removeMetadata: true,
};

export const DEFAULT_CATEGORY_SETTINGS: Record<MediaKind, FileConversionSettings> = {
  image: {
    format: "png",
    preset: "balanced",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      compression: 6,
    },
  },
  audio: {
    format: "mp3",
    preset: "balanced",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      quality: 86,
      bitrate: 192,
    },
  },
  video: {
    format: "mp4",
    preset: "balanced",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      quality: 86,
      bitrate: 10,
      resolution: "1080p",
    },
  },
};

export function getPresetOptionsForKind(kind: MediaKind) {
  if (kind === "audio") {
    return AUDIO_PRESET_OPTIONS;
  }

  if (kind === "video") {
    return VIDEO_PRESET_OPTIONS;
  }

  return IMAGE_PRESET_OPTIONS;
}

export function createDefaultFileSettings(kind: MediaKind): FileConversionSettings {
  const base = DEFAULT_CATEGORY_SETTINGS[kind];

  return {
    format: base.format,
    preset: base.preset,
    advanced: { ...base.advanced },
  };
}

export function createPresetAdvancedSettings(
  kind: MediaKind,
  preset: QualityPreset,
  current: AdvancedSettings,
): AdvancedSettings {
  if (kind === "image") {
    if (preset === "smallest") {
      return { ...current, quality: 68, compression: 9 };
    }

    if (preset === "high") {
      return { ...current, quality: 94, compression: 3 };
    }

    return { ...current, quality: 88, compression: 6 };
  }

  if (kind === "audio") {
    if (preset === "smallest") {
      return {
        ...current,
        quality: 70,
        bitrate: 128,
        sampleRate: null,
        channels: null,
      };
    }

    if (preset === "high") {
      return {
        ...current,
        quality: 94,
        bitrate: 320,
        sampleRate: null,
        channels: null,
      };
    }

    return {
      ...current,
      quality: 86,
      bitrate: 192,
      sampleRate: null,
      channels: null,
    };
  }

  if (preset === "smallest") {
    return {
      ...current,
      quality: 70,
      bitrate: 4,
      frameRate: null,
      resolution: "720p",
    };
  }

  if (preset === "high") {
    return {
      ...current,
      quality: 94,
      bitrate: 16,
      frameRate: null,
      resolution: "1080p",
    };
  }

  return {
    ...current,
    quality: 86,
    bitrate: 10,
    frameRate: null,
    resolution: "1080p",
  };
}
