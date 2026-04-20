import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getFormatOptionsForKind } from "@/features/converter/format-support";
import { getPresetOptionsForKind } from "@/features/converter/presets";
import { hasPresetControlsForKind } from "@/features/converter/settings-rules";
import { useFileSettingsDraft } from "@/features/converter/hooks/useFileSettingsDraft";
import { ConverterDialogShell } from "./ConverterDialogShell";
import { AdvancedSettingsForm } from "../settings/AdvancedSettingsForm";
import { PresetOptionCards } from "../settings/PresetOptionCards";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface FileSettingsDialogProps {
  file: ManagedConversionFile;
  capabilities: EngineCapabilities;
  settings: FileConversionSettings;
  onClose: () => void;
  onSave: (fileId: string, nextSettings: FileConversionSettings) => void;
  onSaved?: () => void;
}

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
      <div className="h-full overflow-hidden px-6 py-5">
        <div className="h-full overflow-auto rounded-panel border border-app-border bg-app-subtle p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-app-fg">
                {file.kind} settings
              </h3>
              <p className="mt-1 text-sm text-app-muted">
                Settings update only this file and do not affect the rest of
                the queue.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-app-fg">
                Output format
              </h4>
              <Select
                value={draft.draftSettings.format}
                options={formatOptions}
                onValueChange={(value) =>
                  draft.changeFormat(value as OutputFormat)
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-app-fg">Presets</h4>
                <p className="mt-1 text-sm text-app-muted">
                  Presets are shortcuts. Editing advanced values turns this file
                  into a custom setup.
                </p>
              </div>
              {canUsePresets ? (
                <PresetOptionCards
                  customMessage="This file is currently using a custom configuration."
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

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-app-fg">
                  Advanced settings
                </h4>
                <p className="mt-1 text-sm text-app-muted">
                  Only controls valid for {file.kind} conversion are shown.
                </p>
              </div>
              <AdvancedSettingsForm
                kind={file.kind}
                capabilities={capabilities}
                settings={draft.draftSettings.advanced}
                onChange={draft.changeAdvanced}
              />
            </div>
          </div>
        </div>
      </div>
    </ConverterDialogShell>
  );
}
