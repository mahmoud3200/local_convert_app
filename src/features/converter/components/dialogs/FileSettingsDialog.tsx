import { ArrowDownToLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFormatOptionsForKind } from "@/features/converter/files/format-support";
import { useFileSettingsDraft } from "@/features/converter/hooks/useFileSettingsDraft";
import { SettingsOverlayFrame } from "../settings/overlay/SettingsOverlayFrame";
import { SettingsSections } from "../settings/overlay/SettingsSections";
import type {
  FileConversionSettings,
  ManagedConversionFile,
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
  const draft = useFileSettingsDraft({ file, settings });
  const sourceLabel = file.extension
    ? file.extension.toUpperCase()
    : file.kind.toUpperCase();
  const targetLabel =
    draft.draftSettings.format === "original"
      ? sourceLabel
      : draft.draftSettings.format.toUpperCase();

  function handleSave() {
    if (!draft.hasChanges) {
      return;
    }

    onSave(file.id, draft.draftSettings);
    onSaved?.();
    onClose();
  }

  return (
    <SettingsOverlayFrame
      footer={
        <>
          <Button
            className="h-[42px] rounded-[10px] border-white/13 bg-white/[0.06] px-6 text-[14px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-[42px] gap-2 rounded-[10px] px-6 text-[14px] font-bold"
            disabled={!draft.hasChanges}
            onClick={handleSave}
          >
            <Check aria-hidden="true" className="h-[15px] w-[15px]" />
            Apply
          </Button>
        </>
      }
      icon={<ArrowDownToLine aria-hidden="true" className="h-[18px] w-[18px]" />}
      subtitle={`${file.name} · ${sourceLabel} → ${targetLabel}`}
      title="Export Settings"
      onClose={onClose}
    >
      <SettingsSections
        capabilities={capabilities}
        formatOptions={formatOptions}
        kind={file.kind}
        naturalHeight={file.naturalHeight}
        naturalWidth={file.naturalWidth}
        settings={draft.draftSettings}
        sourceExtension={file.extension}
        onAdvancedChange={draft.changeAdvanced}
        onFormatChange={draft.changeFormat}
      />
    </SettingsOverlayFrame>
  );
}
