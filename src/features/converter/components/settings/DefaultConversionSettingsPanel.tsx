import { Select } from "@/components/ui/select";
import { getFormatOptionsForKind } from "@/features/converter/format-support";
import { getPresetOptionsForKind } from "@/features/converter/presets";
import { hasPresetControlsForKind } from "@/features/converter/settings-rules";
import { AdvancedSettingsForm } from "./AdvancedSettingsForm";
import { PresetOptionCards } from "./PresetOptionCards";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
  OutputFormat,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface DefaultConversionSettingsPanelProps {
  kind: MediaKind;
  capabilities: EngineCapabilities;
  settings: FileConversionSettings;
  onFormatChange: (kind: MediaKind, value: OutputFormat) => void;
  onPresetChange: (
    kind: MediaKind,
    value: NonNullable<FileConversionSettings["preset"]>,
  ) => void;
  onAdvancedChange: <Key extends keyof AdvancedSettings>(
    kind: MediaKind,
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function DefaultConversionSettingsPanel({
  kind,
  capabilities,
  settings,
  onFormatChange,
  onPresetChange,
  onAdvancedChange,
}: DefaultConversionSettingsPanelProps) {
  const formatOptions = getFormatOptionsForKind(kind, capabilities);
  const presetOptions = getPresetOptionsForKind(kind);
  const canUsePresets = hasPresetControlsForKind(kind, capabilities);
  const showsBrowserVideoLimit =
    capabilities.runtime === "web-wasm" && kind === "video";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-app-fg">
          Default {kind} settings
        </h3>
        <p className="mt-1 text-sm text-app-muted">
          These defaults apply to new {kind} uploads only.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-app-fg">Output format</h4>
        {showsBrowserVideoLimit ? (
          <p className="rounded-panel border border-app-border bg-app-control px-4 py-3 text-sm text-app-muted">
            Browser video stays in the original format. Desktop supports full
            video format conversion and larger editing jobs.
          </p>
        ) : null}
        <Select
          value={settings.format}
          options={formatOptions}
          onValueChange={(value) => onFormatChange(kind, value as OutputFormat)}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-app-fg">Presets</h4>
          <p className="mt-1 text-sm text-app-muted">
            Presets are shortcuts. Editing advanced values turns the preset into
            a custom setup.
          </p>
        </div>
        {canUsePresets ? (
          <PresetOptionCards
            customMessage="This media type is currently using a custom default configuration."
            options={presetOptions}
            selectedPreset={settings.preset}
            onSelect={(value) => onPresetChange(kind, value)}
          />
        ) : (
          <p className="rounded-panel border border-app-border bg-app-control px-4 py-3 text-sm text-app-muted">
            Presets are not available for browser because the advanced controls
            they would change are disabled.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-app-fg">
            Advanced settings
          </h4>
          <p className="mt-1 text-sm text-app-muted">
            Only controls valid for {kind} conversion are shown.
          </p>
        </div>
        <AdvancedSettingsForm
          kind={kind}
          capabilities={capabilities}
          settings={settings.advanced}
          onChange={(key, value) => onAdvancedChange(kind, key, value)}
        />
      </div>
    </div>
  );
}
