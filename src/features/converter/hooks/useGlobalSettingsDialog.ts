import { useMemo, useState } from "react";
import { MEDIA_KINDS } from "@/features/converter/constants";
import { createPresetAdvancedSettings } from "@/features/converter/presets";
import {
  hasPresetControlsForKind,
  sanitizeSettingsForKind,
} from "@/features/converter/settings-rules";
import { cloneSettingsRecord } from "@/features/converter/settings-storage";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
  OutputFormat,
  ThemePreference,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export type SettingsTab = MediaKind | "appearance";

interface UseGlobalSettingsDialogOptions {
  defaultSettingsByKind: Record<MediaKind, FileConversionSettings>;
  capabilities: EngineCapabilities;
  onSaveDefaultSettings: (kind: MediaKind, settings: FileConversionSettings) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
}

export function useGlobalSettingsDialog({
  defaultSettingsByKind,
  capabilities,
  onSaveDefaultSettings,
  onThemePreferenceChange,
}: UseGlobalSettingsDialogOptions) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("image");
  const [draftSettingsByKind, setDraftSettingsByKind] = useState(() =>
    cloneSettingsRecord(defaultSettingsByKind),
  );

  const activeMediaKind = activeTab === "appearance" ? null : activeTab;

  const changedKinds = useMemo(
    () =>
      MEDIA_KINDS.filter(
        (kind) =>
          JSON.stringify(defaultSettingsByKind[kind]) !==
          JSON.stringify(draftSettingsByKind[kind]),
      ),
    [defaultSettingsByKind, draftSettingsByKind],
  );

  function updateDraftSettings(
    kind: MediaKind,
    updater: (settings: FileConversionSettings) => FileConversionSettings,
  ) {
    setDraftSettingsByKind((current) => ({
      ...current,
      [kind]: updater(current[kind]),
    }));
  }

  function updateFormat(kind: MediaKind, value: OutputFormat) {
    updateDraftSettings(kind, (current) => ({
      ...current,
      format: value,
    }));
  }

  function updatePreset(
    kind: MediaKind,
    value: NonNullable<FileConversionSettings["preset"]>,
  ) {
    if (!hasPresetControlsForKind(kind, capabilities)) {
      return;
    }

    updateDraftSettings(kind, (current) => ({
      ...current,
      preset: value,
      advanced: createPresetAdvancedSettings(kind, value, current.advanced),
    }));
  }

  function updateAdvanced<Key extends keyof AdvancedSettings>(
    kind: MediaKind,
    key: Key,
    value: AdvancedSettings[Key],
  ) {
    updateDraftSettings(kind, (current) => {
      const nextAdvanced: AdvancedSettings = {
        ...current.advanced,
        [key]: value,
      };

      if (key === "resolution" && value !== "custom") {
        nextAdvanced.customWidth = "";
        nextAdvanced.customHeight = "";
      }

      return {
        ...current,
        preset: null,
        advanced: nextAdvanced,
      };
    });
  }

  function saveAllChangedDefaults() {
    if (changedKinds.length === 0) {
      return false;
    }

    const nextDraftSettingsByKind = cloneSettingsRecord(draftSettingsByKind);

    for (const kind of changedKinds) {
      const sanitizedSettings = sanitizeSettingsForKind(
        kind,
        draftSettingsByKind[kind],
        undefined,
        capabilities,
      );

      onSaveDefaultSettings(
        kind,
        sanitizedSettings,
      );
      nextDraftSettingsByKind[kind] = sanitizedSettings;
    }

    setDraftSettingsByKind(nextDraftSettingsByKind);
    return true;
  }

  return {
    activeMediaKind,
    activeTab,
    changedKinds,
    draftSettingsByKind,
    hasAnyDraftChanges: changedKinds.length > 0,
    setActiveTab,
    setThemePreference: onThemePreferenceChange,
    updateAdvanced,
    updateFormat,
    updatePreset,
    saveAllChangedDefaults,
  };
}
