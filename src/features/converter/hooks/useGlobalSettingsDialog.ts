import { useMemo, useState } from "react";
import { MEDIA_KINDS } from "@/features/converter/constants";
import { changeAdvancedSetting } from "@/features/converter/settings/advanced-updates";
import { sanitizeSettingsForKind } from "@/features/converter/settings/settings-rules";
import { cloneSettingsRecord } from "@/features/converter/settings/settings-storage";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
  OutputFormat,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

type SettingsTab = MediaKind;

interface UseGlobalSettingsDialogOptions {
  defaultSettingsByKind: Record<MediaKind, FileConversionSettings>;
  capabilities: EngineCapabilities;
  onSaveDefaultSettings: (kind: MediaKind, settings: FileConversionSettings) => void;
}

export function useGlobalSettingsDialog({
  defaultSettingsByKind,
  capabilities,
  onSaveDefaultSettings,
}: UseGlobalSettingsDialogOptions) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("image");
  const [draftSettingsByKind, setDraftSettingsByKind] = useState(() =>
    cloneSettingsRecord(defaultSettingsByKind),
  );

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

  function updateAdvanced<Key extends keyof AdvancedSettings>(
    kind: MediaKind,
    key: Key,
    value: AdvancedSettings[Key],
  ) {
    updateDraftSettings(kind, (current) => ({
      ...current,
      advanced: changeAdvancedSetting(current.advanced, key, value),
    }));
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

      onSaveDefaultSettings(kind, sanitizedSettings);
      nextDraftSettingsByKind[kind] = sanitizedSettings;
    }

    setDraftSettingsByKind(nextDraftSettingsByKind);
    return true;
  }

  return {
    activeTab,
    changedKinds,
    draftSettingsByKind,
    hasAnyDraftChanges: changedKinds.length > 0,
    setActiveTab,
    updateAdvanced,
    updateFormat,
    saveAllChangedDefaults,
  };
}
