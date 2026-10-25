import { useMemo, useState } from "react";
import { changeAdvancedSetting } from "@/features/converter/settings/advanced-updates";
import type {
  AdvancedSettings,
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
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

  function changeAdvanced<Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) {
    setDraftSettings((current) => ({
      ...current,
      advanced: changeAdvancedSetting(current.advanced, key, value, {
        width: file.naturalWidth,
        height: file.naturalHeight,
      }),
    }));
  }

  return {
    changeAdvanced,
    changeFormat,
    draftSettings,
    hasChanges,
  };
}
