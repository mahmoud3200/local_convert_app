import type { AdvancedSettings } from "../types";

interface NaturalSize {
  height: number | null;
  width: number | null;
}

export function changeAdvancedSetting<Key extends keyof AdvancedSettings>(
  advanced: AdvancedSettings,
  key: Key,
  value: AdvancedSettings[Key],
  naturalSize?: NaturalSize,
): AdvancedSettings {
  const next: AdvancedSettings = {
    ...advanced,
    [key]: value,
  };

  if (key !== "resolution") {
    return next;
  }

  if (value !== "custom") {
    next.customWidth = "";
    next.customHeight = "";
    return next;
  }

  if (next.customWidth === "" && naturalSize?.width) {
    next.customWidth = naturalSize.width;
  }

  if (next.customHeight === "" && naturalSize?.height) {
    next.customHeight = naturalSize.height;
  }

  return next;
}
