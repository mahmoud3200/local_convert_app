import type { MediaKind, ResolutionMode } from "../types";

export const MEDIA_KINDS: MediaKind[] = ["image", "audio", "video"];

export const MAX_MEDIA_URL_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY =
  "local-convert:ffmpeg-desktop-notice-dismissed:v1";

export const DESKTOP_QUEUE_STORAGE_KEY = "local-convert:desktop-queue:v1";

export const DEFAULT_SETTINGS_STORAGE_KEY = "local-convert:defaults:v1";

export const PROJECT_GITHUB_URL =
  "https://github.com/mahmoud3200/local_convert_app";

export const DESKTOP_DOWNLOAD_LINK =
  "https://github.com/mahmoud3200/local_convert_app/releases/tag/v1.0-beta";

export interface SettingsRange {
  min: number;
  max: number;
  step: number;
}

export const QUALITY_RANGE: SettingsRange = { min: 1, max: 100, step: 1 };

export const COMPRESSION_RANGE: SettingsRange = { min: 0, max: 9, step: 1 };

export const DIMENSION_RANGE: SettingsRange = { min: 1, max: 16384, step: 1 };

export const FRAME_RATE_RANGE: SettingsRange = { min: 1, max: 240, step: 1 };

export const AUDIO_BITRATE_RANGE: SettingsRange = {
  min: 8,
  max: 512,
  step: 8,
};

export const VIDEO_BITRATE_RANGE: SettingsRange = { min: 1, max: 200, step: 1 };

export const FRAME_RATE_OPTIONS = [24, 30, 60] as const;

export const SAMPLE_RATE_OPTIONS = [
  { value: 32000, label: "32 kHz" },
  { value: 44100, label: "44.1 kHz" },
  { value: 48000, label: "48 kHz" },
] as const;

export const VALID_SAMPLE_RATES = new Set<number>(
  SAMPLE_RATE_OPTIONS.map((option) => option.value),
);

export const CHANNEL_OPTIONS = [
  { value: 1, label: "Mono" },
  { value: 2, label: "Stereo" },
] as const;

export const RESOLUTION_OPTIONS: Record<MediaKind, ResolutionMode[]> = {
  image: ["original", "2x", "custom"],
  video: ["original", "1080p", "720p", "custom"],
  audio: [],
};

export const RESOLUTION_LABELS: Record<ResolutionMode, string> = {
  original: "Original size",
  "2x": "2× upscale",
  "1080p": "1080p",
  "720p": "720p",
  custom: "Custom",
};
