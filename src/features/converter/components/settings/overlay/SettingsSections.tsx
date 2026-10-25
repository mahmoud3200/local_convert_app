import { Fragment } from "react";
import { getOutputDimensions } from "@/features/converter/settings/output-dimensions";
import { buildAudioSections } from "./audio-sections";
import { buildVisualSections } from "./visual-sections";
import { FormatSelect } from "./FormatSelect";
import { formatChannels, formatSampleRate } from "./settings-labels";
import {
  SETTINGS_SECTION_ORDER,
  type SettingsSectionEntry,
} from "./settings-section";
import { SummaryStrip } from "./SummaryStrip";
import { ToggleRow } from "./ToggleRow";
import { getSettingsVisibility } from "./settings-visibility";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
  OutputFormat,
  SelectOptionValue,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface SettingsSectionsProps {
  capabilities?: EngineCapabilities;
  formatOptions: SelectOptionValue<OutputFormat>[];
  kind: MediaKind;
  naturalHeight?: number | null;
  naturalWidth?: number | null;
  settings: FileConversionSettings;
  sourceExtension?: string;
  onAdvancedChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
  onFormatChange: (format: OutputFormat) => void;
}

export function SettingsSections({
  capabilities,
  formatOptions,
  kind,
  naturalHeight = null,
  naturalWidth = null,
  settings,
  sourceExtension = "",
  onAdvancedChange,
  onFormatChange,
}: SettingsSectionsProps) {
  const advanced = settings.advanced;
  const visibility = getSettingsVisibility(kind, capabilities);
  const outputDimensions = getOutputDimensions(
    advanced.resolution,
    advanced.customWidth,
    advanced.customHeight,
    naturalWidth,
    naturalHeight,
  );

  const advancedSections = new Map<string, SettingsSectionEntry>(
    [
      ...buildVisualSections({
        advanced,
        kind,
        naturalHeight,
        naturalWidth,
        visibility,
        onAdvancedChange,
      }),
      ...buildAudioSections({
        advanced,
        kind,
        visibility,
        onAdvancedChange,
      }),
    ].map((section) => [section.id, section]),
  );
  const sections: SettingsSectionEntry[] = SETTINGS_SECTION_ORDER.flatMap(
    (id) => advancedSections.get(id) ?? [],
  );

  if (visibility.canShowMetadata) {
    sections.push({
      id: "metadata",
      content: (
        <ToggleRow
          checked={advanced.removeMetadata}
          description="Strips EXIF, GPS and author data for privacy"
          label="Remove Metadata"
          onChange={(checked) => onAdvancedChange("removeMetadata", checked)}
        />
      ),
    });
  }

  const dimensionsLabel =
    outputDimensions.width && outputDimensions.height
      ? `${outputDimensions.width} × ${outputDimensions.height} px`
      : "Original";
  const resolvedFormatOptions = formatOptions.map((option) =>
    option.value === "original" && sourceExtension
      ? { ...option, label: `${sourceExtension.toUpperCase()} (original)` }
      : option,
  );

  sections.push({
    id: "summary",
    content: (
      <SummaryStrip
        cells={[
          {
            label: kind === "audio" ? "Output" : "Output dimensions",
            value:
              kind === "audio"
                ? `${formatSampleRate(advanced.sampleRate)} · ${formatChannels(advanced.channels)}`
                : dimensionsLabel,
          },
          {
            label: "Format",
            value: (
              <FormatSelect
                options={resolvedFormatOptions}
                value={settings.format}
                onChange={onFormatChange}
              />
            ),
          },
        ]}
      />
    ),
  });

  return (
    <div className="flex flex-col gap-7">
      {visibility.isBrowserVideo ? (
        <p className="rounded-[10px] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[12px] leading-[18px] text-white/45">
          Browser video exports keep the source format and skip heavy video
          editing. Use the desktop app for format changes, bitrate, frame rate
          and resolution control.
        </p>
      ) : null}

      {sections.map((section, index) => (
        <Fragment key={section.id}>
          {index > 0 ? <div className="h-px bg-white/5" /> : null}
          {section.content}
        </Fragment>
      ))}
    </div>
  );
}
