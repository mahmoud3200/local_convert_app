import {
  COMPRESSION_RANGE,
  QUALITY_RANGE,
} from "@/features/converter/constants";
import { buildFrameRateOptions } from "./settings-labels";
import { OptionCardGroup } from "./OptionCardGroup";
import { ResolutionField } from "./ResolutionField";
import { SliderField } from "./SliderField";
import type { SettingsSectionEntry } from "./settings-section";
import type { SettingsVisibility } from "./settings-visibility";
import type {
  AdvancedSettings,
  MediaKind,
} from "@/features/converter/types";

interface VisualSectionsOptions {
  advanced: AdvancedSettings;
  kind: MediaKind;
  naturalHeight: number | null;
  naturalWidth: number | null;
  visibility: SettingsVisibility;
  onAdvancedChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function buildVisualSections({
  advanced,
  kind,
  naturalHeight,
  naturalWidth,
  visibility,
  onAdvancedChange,
}: VisualSectionsOptions): SettingsSectionEntry[] {
  const sections: SettingsSectionEntry[] = [];

  if (visibility.canShowQuality) {
    sections.push({
      id: "quality",
      content: (
        <SliderField
          description="Higher quality means larger file size"
          endLabel="Largest file"
          label="Quality"
          range={QUALITY_RANGE}
          startLabel="Smallest file"
          value={advanced.quality}
          onChange={(value) => onAdvancedChange("quality", value)}
        />
      ),
    });
  }

  if (visibility.canShowCompression && advanced.compression !== null) {
    sections.push({
      id: "compression",
      content: (
        <SliderField
          description="Lossless at 0 · aggressive at 9"
          endLabel="9 · Smallest"
          label="Compression"
          range={COMPRESSION_RANGE}
          startLabel="0 · Lossless"
          value={advanced.compression}
          onChange={(value) => onAdvancedChange("compression", value)}
        />
      ),
    });
  }

  if (visibility.canShowFrameRate) {
    sections.push({
      id: "frame-rate",
      content: (
        <OptionCardGroup
          description="Source frame rate is kept when set to original."
          label="Frame rate"
          options={buildFrameRateOptions(advanced.frameRate)}
          value={advanced.frameRate ?? 0}
          onChange={(value) =>
            onAdvancedChange("frameRate", value === 0 ? null : value)
          }
        />
      ),
    });
  }

  if (visibility.canShowResolutionCards) {
    sections.push({
      id: "resolution",
      content: (
        <ResolutionField
          customHeight={advanced.customHeight}
          customWidth={advanced.customWidth}
          kind={kind}
          naturalHeight={naturalHeight}
          naturalWidth={naturalWidth}
          resolution={advanced.resolution}
          onChange={onAdvancedChange}
        />
      ),
    });
  }

  return sections;
}
