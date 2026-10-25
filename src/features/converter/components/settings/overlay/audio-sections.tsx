import {
  AUDIO_BITRATE_RANGE,
  CHANNEL_OPTIONS,
  SAMPLE_RATE_OPTIONS,
  VIDEO_BITRATE_RANGE,
} from "@/features/converter/constants";
import { OptionCardGroup } from "./OptionCardGroup";
import { SliderField } from "./SliderField";
import type { SettingsSectionEntry } from "./settings-section";
import type { SettingsVisibility } from "./settings-visibility";
import type {
  AdvancedSettings,
  MediaKind,
} from "@/features/converter/types";

interface AudioSectionsOptions {
  advanced: AdvancedSettings;
  kind: MediaKind;
  visibility: SettingsVisibility;
  onAdvancedChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function buildAudioSections({
  advanced,
  kind,
  visibility,
  onAdvancedChange,
}: AudioSectionsOptions): SettingsSectionEntry[] {
  const sections: SettingsSectionEntry[] = [];

  if (visibility.canShowBitrate) {
    const isAudio = kind === "audio";
    const range = isAudio ? AUDIO_BITRATE_RANGE : VIDEO_BITRATE_RANGE;
    const fallback = isAudio ? 192 : 10;

    sections.push({
      id: "bitrate",
      content: (
        <SliderField
          description={
            isAudio
              ? "Target bitrate for the exported audio"
              : "Average bitrate for the exported video"
          }
          endLabel={isAudio ? "512 kbps" : "200 Mbps"}
          label={isAudio ? "Bitrate (kbps)" : "Bitrate (Mbps)"}
          range={range}
          startLabel={isAudio ? "8 kbps" : "1 Mbps"}
          value={advanced.bitrate ?? fallback}
          onChange={(value) => onAdvancedChange("bitrate", value)}
        />
      ),
    });
  }

  if (visibility.canShowSampleRate) {
    sections.push({
      id: "sample-rate",
      content: (
        <OptionCardGroup
          label="Sample rate"
          options={[
            { value: 0, label: "Original" },
            ...SAMPLE_RATE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          value={advanced.sampleRate ?? 0}
          onChange={(value) =>
            onAdvancedChange("sampleRate", value === 0 ? null : value)
          }
        />
      ),
    });
  }

  if (visibility.canShowChannels) {
    sections.push({
      id: "channels",
      content: (
        <OptionCardGroup
          label="Channels"
          options={[
            { value: 0, label: "Original" },
            ...CHANNEL_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          value={advanced.channels ?? 0}
          onChange={(value) =>
            onAdvancedChange(
              "channels",
              value === 0 ? null : (value as 1 | 2),
            )
          }
        />
      ),
    });
  }

  return sections;
}
