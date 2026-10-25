import { DEFAULT_SETTINGS_STORAGE_KEY, MEDIA_KINDS } from "../constants";
import { createDefaultFileSettings } from "./defaults";
import { sanitizeSettingsForKind } from "./settings-rules";
import type { FileConversionSettings, MediaKind } from "../types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export function loadStoredDefaults(
  capabilities?: EngineCapabilities,
): Record<MediaKind, FileConversionSettings> {
  const fallback = createDefaultSettingsRecord(capabilities);

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(DEFAULT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<Record<MediaKind, FileConversionSettings>>;

    return {
      image: hydrateStoredSettings("image", parsed.image, capabilities),
      audio: hydrateStoredSettings("audio", parsed.audio, capabilities),
      video: hydrateStoredSettings("video", parsed.video, capabilities),
    };
  } catch {
    return fallback;
  }
}

export function saveStoredDefaults(defaults: Record<MediaKind, FileConversionSettings>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEFAULT_SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
}

function createDefaultSettingsRecord(
  capabilities?: EngineCapabilities,
): Record<MediaKind, FileConversionSettings> {
  return {
    image: sanitizeSettingsForKind(
      "image",
      createDefaultFileSettings("image"),
      undefined,
      capabilities,
    ),
    audio: sanitizeSettingsForKind(
      "audio",
      createDefaultFileSettings("audio"),
      undefined,
      capabilities,
    ),
    video: sanitizeSettingsForKind(
      "video",
      createDefaultFileSettings("video"),
      undefined,
      capabilities,
    ),
  };
}

export function cloneFileSettings(settings: FileConversionSettings): FileConversionSettings {
  return {
    format: settings.format,
    advanced: { ...settings.advanced },
  };
}

export function cloneSettingsRecord(
  record: Record<MediaKind, FileConversionSettings>,
): Record<MediaKind, FileConversionSettings> {
  return MEDIA_KINDS.reduce(
    (next, kind) => {
      next[kind] = cloneFileSettings(record[kind]);
      return next;
    },
    {} as Record<MediaKind, FileConversionSettings>,
  );
}

function hydrateStoredSettings(
  kind: MediaKind,
  value: FileConversionSettings | undefined,
  capabilities?: EngineCapabilities,
) {
  if (!value) {
    return sanitizeSettingsForKind(
      kind,
      createDefaultFileSettings(kind),
      undefined,
      capabilities,
    );
  }

  return sanitizeSettingsForKind(kind, value, undefined, capabilities);
}
