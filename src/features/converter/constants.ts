import type { MediaKind } from "./types";

export const MEDIA_KINDS: MediaKind[] = ["image", "audio", "video"];

export const MAX_PREVIEW_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY =
  "local-convert:ffmpeg-desktop-notice-dismissed:v1";

export const DESKTOP_QUEUE_STORAGE_KEY =
  "local-convert:desktop-queue:v1";

export const PROJECT_GITHUB_URL =
  "https://github.com/mahmoud3200/local_convert_app";
