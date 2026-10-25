import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
} from "../types";

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
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

const DEFAULT_SETTINGS_BY_KIND: Record<MediaKind, FileConversionSettings> = {
  image: {
    format: "png",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      compression: 6,
    },
  },
  audio: {
    format: "mp3",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      quality: 86,
      bitrate: 192,
    },
  },
  video: {
    format: "mp4",
    advanced: {
      ...DEFAULT_ADVANCED_SETTINGS,
      quality: 86,
      bitrate: 10,
      resolution: "1080p",
    },
  },
};

export function createDefaultFileSettings(kind: MediaKind): FileConversionSettings {
  const base = DEFAULT_SETTINGS_BY_KIND[kind];

  return {
    format: base.format,
    advanced: { ...base.advanced },
  };
}
