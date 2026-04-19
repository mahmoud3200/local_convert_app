import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getFormatOptionsForKind } from "@/features/converter/format-support";
import { getPresetOptionsForKind } from "@/features/converter/presets";
import { hasPresetControlsForKind } from "@/features/converter/settings-rules";
import { useFileSettingsDraft } from "@/features/converter/hooks/useFileSettingsDraft";
import { ConverterDialogShell } from "./ConverterDialogShell";
import { AdvancedSettingsForm } from "../settings/AdvancedSettingsForm";
import { PresetOptionCards } from "../settings/PresetOptionCards";
import { SettingsSectionNav } from "../settings/SettingsSectionNav";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

type SettingsSection = "format" | "preset" | "advanced";

interface FileSettingsDialogProps {
  file: ManagedConversionFile;
  capabilities: EngineCapabilities;
  settings: FileConversionSettings;
  onClose: () => void;
  onSave: (fileId: string, nextSettings: FileConversionSettings) => void;
  onSaved?: () => void;
}

const sections: Array<{ id: SettingsSection; label: string }> = [
  { id: "format", label: "Output format" },
  { id: "preset", label: "Presets" },
  { id: "advanced", label: "Advanced settings" },
];

export function FileSettingsDialog({
  file,
  capabilities,
  settings,
  onClose,
  onSave,
  onSaved,
}: FileSettingsDialogProps) {
  const formatOptions = getFormatOptionsForKind(file.kind, capabilities);
  const presetOptions = getPresetOptionsForKind(file.kind);
  const canUsePresets = hasPresetControlsForKind(file.kind, capabilities);
  const [activeSection, setActiveSection] = useState<SettingsSection>("format");
  const draft = useFileSettingsDraft({ file, settings });

  function handleSave() {
    if (!draft.hasChanges) {
      return;
    }

    onSave(file.id, draft.draftSettings);
    onSaved?.();
    onClose();
  }

  return (
    <ConverterDialogShell
      description="Settings update only this file and never leak into the rest of the queue."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!draft.hasChanges} onClick={handleSave}>
            Save
          </Button>
        </>
      }
      isOpen
      sizeClassName="h-[min(48rem,calc(100vh-2rem))] w-[min(64rem,calc(100vw-2rem))]"
      title={file.name}
      onClose={onClose}
    >
      <div className="grid h-full gap-6 overflow-hidden px-6 py-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsSectionNav
          activeSection={activeSection}
          activeTextClassName="text-app-accent"
          sections={sections}
          onSectionChange={setActiveSection}
        />

        <div className="min-h-0 overflow-auto rounded-panel border border-app-border bg-app-subtle p-4">
          {activeSection === "format" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-app-fg">
                  Output format
                </h3>
                <p className="mt-1 text-sm text-app-muted">
                  Choose the export format for this {file.kind} file.
                </p>
              </div>
              <Select
                value={draft.draftSettings.format}
                options={formatOptions}
                onValueChange={(value) =>
                  draft.changeFormat(value as OutputFormat)
                }
              />
            </div>
          ) : null}

          {activeSection === "preset" ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-app-fg">Presets</h3>
                <p className="mt-1 text-sm text-app-muted">
                  Pick a quality preset for this single file.
                </p>
              </div>
              {canUsePresets ? (
                <PresetOptionCards
                  customMessage="Advanced values were edited manually, so this file is using a custom configuration."
                  options={presetOptions}
                  selectedPreset={draft.draftSettings.preset}
                  onSelect={draft.changePreset}
                />
              ) : (
                <p className="rounded-panel border border-app-border bg-app-control px-4 py-3 text-sm text-app-muted">
                  Presets are not available for browser because the advanced
                  controls they would change are disabled.
                </p>
              )}
            </div>
          ) : null}

          {activeSection === "advanced" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-app-fg">
                  Advanced settings
                </h3>
                <p className="mt-1 text-sm text-app-muted">
                  Only valid settings for the detected file type are shown.
                </p>
              </div>
              <AdvancedSettingsForm
                kind={file.kind}
                capabilities={capabilities}
                settings={draft.draftSettings.advanced}
                onChange={draft.changeAdvanced}
              />
            </div>
          ) : null}
        </div>
      </div>
    </ConverterDialogShell>
  );
}
