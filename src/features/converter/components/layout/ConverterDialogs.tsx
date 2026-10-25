import { FileSettingsDialog } from "../dialogs/FileSettingsDialog";
import { GlobalSettingsDialog } from "../dialogs/GlobalSettingsDialog";
import type {
  FileConversionSettings,
  ManagedConversionFile,
  MediaKind,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface ConverterDialogsProps {
  capabilities: EngineCapabilities;
  defaultSettingsByKind: Record<MediaKind, FileConversionSettings>;
  file: ManagedConversionFile | null;
  fileSettings?: FileConversionSettings;
  isGlobalSettingsOpen: boolean;
  onCloseFileSettings: () => void;
  onCloseGlobalSettings: () => void;
  onSaveDefaultSettings: (
    kind: MediaKind,
    settings: FileConversionSettings,
  ) => void;
  onSaveSettings: (fileId: string, settings: FileConversionSettings) => void;
  onSaved: () => void;
}

export function ConverterDialogs({
  capabilities,
  defaultSettingsByKind,
  file,
  fileSettings,
  isGlobalSettingsOpen,
  onCloseFileSettings,
  onCloseGlobalSettings,
  onSaveDefaultSettings,
  onSaveSettings,
  onSaved,
}: ConverterDialogsProps) {
  return (
    <>
      {file && fileSettings ? (
        <FileSettingsDialog
          capabilities={capabilities}
          file={file}
          settings={fileSettings}
          onClose={onCloseFileSettings}
          onSaved={onSaved}
          onSave={onSaveSettings}
        />
      ) : null}

      {isGlobalSettingsOpen ? (
        <GlobalSettingsDialog
          capabilities={capabilities}
          defaultSettingsByKind={defaultSettingsByKind}
          onClose={onCloseGlobalSettings}
          onSaved={onSaved}
          onSaveDefaultSettings={onSaveDefaultSettings}
        />
      ) : null}
    </>
  );
}
