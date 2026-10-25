import { useEffect, useState } from "react";
import {
  cloneFileSettings,
  loadStoredDefaults,
  saveStoredDefaults,
} from "@/features/converter/settings/settings-storage";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  MediaKind,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

type SettingsState = Record<string, FileConversionSettings>;

export function useConversionSettings(
  capabilities?: EngineCapabilities,
  initialSettingsByFileId: SettingsState = {},
) {
  const [storedSettingsByFileId, setStoredSettingsByFileId] = useState<SettingsState>(() =>
    Object.fromEntries(
      Object.entries(initialSettingsByFileId).map(([fileId, settings]) => [
        fileId,
        cloneFileSettings(settings),
      ]),
    ),
  );
  const [defaultSettingsByKind, setDefaultSettingsByKind] = useState<
    Record<MediaKind, FileConversionSettings>
  >(() => loadStoredDefaults(capabilities));

  useEffect(() => {
    saveStoredDefaults(defaultSettingsByKind);
  }, [defaultSettingsByKind]);

  const settingsByFileId = storedSettingsByFileId;

  function removeSettings(fileId: string) {
    setStoredSettingsByFileId((current) => {
      if (!(fileId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[fileId];
      return next;
    });
  }

  function replaceSettings(fileId: string, nextSettings: FileConversionSettings) {
    setStoredSettingsByFileId((current) => ({
      ...current,
      [fileId]: cloneFileSettings(nextSettings),
    }));
  }

  function getSettings(fileId: string) {
    return settingsByFileId[fileId];
  }

  function clearSettings() {
    setStoredSettingsByFileId({});
  }

  function restoreSettings(nextSettingsByFileId: SettingsState) {
    setStoredSettingsByFileId(
      Object.fromEntries(
        Object.entries(nextSettingsByFileId).map(([fileId, settings]) => [
          fileId,
          cloneFileSettings(settings),
        ]),
      ),
    );
  }

  function registerFiles(nextFiles: Array<ManagedConversionFile>) {
    if (nextFiles.length === 0) {
      return;
    }

    setStoredSettingsByFileId((current) => {
      const next = { ...current };
      let changed = false;

      for (const file of nextFiles) {
        if (next[file.id]) {
          continue;
        }

        next[file.id] = cloneFileSettings(defaultSettingsByKind[file.kind]);
        changed = true;
      }

      return changed ? next : current;
    });
  }

  function replaceDefaultSettings(kind: MediaKind, nextSettings: FileConversionSettings) {
    setDefaultSettingsByKind((current) => ({
      ...current,
      [kind]: cloneFileSettings(nextSettings),
    }));
  }

  return {
    clearSettings,
    defaultSettingsByKind,
    settingsByFileId,
    getSettings,
    registerFiles,
    removeSettings,
    replaceSettings,
    replaceDefaultSettings,
    restoreSettings,
  };
}
