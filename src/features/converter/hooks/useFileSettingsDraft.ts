import { useMemo, useState } from "react";
import { createPresetAdvancedSettings } from "@/features/converter/presets";
import type {
  AdvancedSettings,
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
  QualityPreset,
} from "@/features/converter/types";

interface UseFileSettingsDraftOptions {
  file: ManagedConversionFile;
  settings: FileConversionSettings;
}

export function useFileSettingsDraft({
  file,
  settings,
}: UseFileSettingsDraftOptions) {
  const [draftSettings, setDraftSettings] = useState<FileConversionSettings>({
    format: settings.format,
    preset: settings.preset,
    advanced: { ...settings.advanced },
  });

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(draftSettings),
    [draftSettings, settings],
  );

  function changeFormat(value: OutputFormat) {
    setDraftSettings((current) => ({
      ...current,
      format: value,
    }));
  }

  function changePreset(value: QualityPreset) {
    setDraftSettings((current) => ({
      ...current,
      preset: value,
      advanced: createPresetAdvancedSettings(
        file.kind,
        value,
        current.advanced,
      ),
    }));
  }

  function changeAdvanced<Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) {
    setDraftSettings((current) => {
      const nextAdvanced: AdvancedSettings = {
        ...current.advanced,
        [key]: value,
      };

      if (key === "resolution" && value !== "custom") {
        nextAdvanced.customWidth = "";
        nextAdvanced.customHeight = "";
      }

      if (key === "resolution" && value === "custom") {
        if (nextAdvanced.customWidth === "") {
          nextAdvanced.customWidth = file.naturalWidth ?? "";
        }

        if (nextAdvanced.customHeight === "") {
          nextAdvanced.customHeight = file.naturalHeight ?? "";
        }
      }

      return {
        ...current,
        preset: null,
        advanced: nextAdvanced,
      };
    });
  }

  return {
    changeAdvanced,
    changeFormat,
    changePreset,
    draftSettings,
    hasChanges,
  };
}
