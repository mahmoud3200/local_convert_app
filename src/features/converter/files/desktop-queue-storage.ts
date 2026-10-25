import { DESKTOP_QUEUE_STORAGE_KEY } from "../constants";
import { formatBytes } from "./file-formatting";
import { getDetectedFileInfoFromName } from "./format-support";
import { createDefaultFileSettings } from "../settings/defaults";
import { cloneFileSettings } from "../settings/settings-storage";
import { sanitizeSettingsForKind } from "../settings/settings-rules";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  MediaKind,
} from "../types";
import type { EngineCapabilities } from "@/platform/converter/engine";

type StoredDesktopQueuedFile = {
  id: string;
  nativePath: string;
  name: string;
  size: number;
  type: string;
  kind: MediaKind;
  extension: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
};

type StoredDesktopQueue = {
  files: StoredDesktopQueuedFile[];
  settingsByFileId: Record<string, FileConversionSettings>;
};

type RestoredDesktopQueue = {
  files: ManagedConversionFile[];
  settingsByFileId: Record<string, FileConversionSettings>;
};

export function loadStoredDesktopQueue(
  capabilities?: EngineCapabilities,
): RestoredDesktopQueue {
  if (typeof window === "undefined") {
    return emptyQueue();
  }

  try {
    const raw = window.localStorage.getItem(DESKTOP_QUEUE_STORAGE_KEY);
    if (!raw) {
      return emptyQueue();
    }

    const parsed = JSON.parse(raw) as Partial<StoredDesktopQueue>;
    const storedFiles = Array.isArray(parsed.files) ? parsed.files : [];
    const storedSettings =
      parsed.settingsByFileId && typeof parsed.settingsByFileId === "object"
        ? parsed.settingsByFileId
        : {};
    const files = storedFiles.flatMap((file) =>
      restoreDesktopFile(file, capabilities),
    );
    const settingsByFileId: Record<string, FileConversionSettings> = {};

    for (const file of files) {
      const settings = storedSettings[file.id] ?? createDefaultFileSettings(file.kind);

      settingsByFileId[file.id] = sanitizeSettingsForKind(
        file.kind,
        settings,
        {
          width: file.naturalWidth,
          height: file.naturalHeight,
        },
        capabilities,
      );
    }

    return { files, settingsByFileId };
  } catch {
    return emptyQueue();
  }
}

export function saveStoredDesktopQueue(
  files: ManagedConversionFile[],
  settingsByFileId: Record<string, FileConversionSettings>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const nativeFiles = files.filter((file) => file.nativePath);

  if (nativeFiles.length === 0) {
    window.localStorage.removeItem(DESKTOP_QUEUE_STORAGE_KEY);
    return;
  }

  const snapshot: StoredDesktopQueue = {
    files: nativeFiles.map((file) => ({
      id: file.id,
      nativePath: file.nativePath ?? "",
      name: file.name,
      size: file.size,
      type: file.type,
      kind: file.kind,
      extension: file.extension,
      naturalWidth: file.naturalWidth,
      naturalHeight: file.naturalHeight,
    })),
    settingsByFileId: Object.fromEntries(
      nativeFiles
        .map((file) => {
          const settings = settingsByFileId[file.id];
          return settings ? [file.id, cloneFileSettings(settings)] : null;
        })
        .filter((entry): entry is [string, FileConversionSettings] =>
          Boolean(entry),
        ),
    ),
  };

  window.localStorage.setItem(DESKTOP_QUEUE_STORAGE_KEY, JSON.stringify(snapshot));
}

function restoreDesktopFile(
  value: Partial<StoredDesktopQueuedFile>,
  capabilities?: EngineCapabilities,
) {
  if (
    !value.id ||
    !value.nativePath ||
    !value.name ||
    typeof value.size !== "number"
  ) {
    return [];
  }

  const detected = getDetectedFileInfoFromName(
    value.name,
    value.type,
    capabilities,
  );

  if (detected.kind === "unknown") {
    return [];
  }

  return [
    {
      id: value.id,
      nativePath: value.nativePath,
      name: value.name,
      size: value.size,
      sizeLabel: formatBytes(value.size),
      type: value.type || detected.extension.toUpperCase() || "Unknown",
      kind: detected.kind,
      extension: detected.extension,
      previewUrl: null,
      shouldRevokePreviewUrl: false,
      naturalWidth: toNullableNumber(value.naturalWidth),
      naturalHeight: toNullableNumber(value.naturalHeight),
      status: "ready",
    } satisfies ManagedConversionFile,
  ];
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function emptyQueue(): RestoredDesktopQueue {
  return {
    files: [],
    settingsByFileId: {},
  };
}
