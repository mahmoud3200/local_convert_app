import { Button } from "@/components/ui/button";
import { useGlobalSettingsDialog } from "@/features/converter/hooks/useGlobalSettingsDialog";
import { ConverterDialogShell } from "./ConverterDialogShell";
import { AppearanceSettingsPanel } from "../settings/AppearanceSettingsPanel";
import { DefaultConversionSettingsPanel } from "../settings/DefaultConversionSettingsPanel";
import { SettingsSectionNav } from "../settings/SettingsSectionNav";
import type {
  FileConversionSettings,
  MediaKind,
  ResolvedTheme,
  ThemePreference,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface GlobalSettingsDialogProps {
  defaultSettingsByKind: Record<MediaKind, FileConversionSettings>;
  capabilities: EngineCapabilities;
  resolvedTheme: ResolvedTheme;
  themePreference: ThemePreference;
  onClose: () => void;
  onSaveDefaultSettings: (
    kind: MediaKind,
    settings: FileConversionSettings,
  ) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onSaved?: () => void;
}

const tabs = [
  { id: "image", label: "Images" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "appearance", label: "Appearance" },
] as const;

export function GlobalSettingsDialog({
  defaultSettingsByKind,
  capabilities,
  resolvedTheme,
  themePreference,
  onClose,
  onSaveDefaultSettings,
  onThemePreferenceChange,
  onSaved,
}: GlobalSettingsDialogProps) {
  const {
    activeMediaKind,
    activeTab,
    draftSettingsByKind,
    hasAnyDraftChanges,
    saveAllChangedDefaults,
    setActiveTab,
    setThemePreference,
    updateAdvanced,
    updateFormat,
    updatePreset,
  } = useGlobalSettingsDialog({
    defaultSettingsByKind,
    onSaveDefaultSettings,
    onThemePreferenceChange,
    capabilities,
  });

  function handleSave() {
    const didSave = saveAllChangedDefaults();

    if (didSave) {
      onSaved?.();
      onClose();
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button disabled={!hasAnyDraftChanges} onClick={handleSave}>
        Save
      </Button>
    </>
  );

  return (
    <ConverterDialogShell
      description="Manage default conversion behavior for future uploads and adjust the app appearance."
      footer={footer}
      isOpen
      sizeClassName="h-[min(48rem,calc(100vh-2rem))] w-[min(64rem,calc(100vw-2rem))]"
      title="Settings"
      onClose={onClose}
    >
      <div className="grid h-full gap-6 overflow-hidden px-6 py-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsSectionNav
          activeSection={activeTab}
          sections={tabs}
          onSectionChange={setActiveTab}
        />

        <div className="min-h-0 overflow-auto rounded-panel border border-app-border bg-app-subtle p-4">
          {activeMediaKind ? (
            <DefaultConversionSettingsPanel
              kind={activeMediaKind}
              capabilities={capabilities}
              settings={draftSettingsByKind[activeMediaKind]}
              onAdvancedChange={updateAdvanced}
              onFormatChange={updateFormat}
              onPresetChange={updatePreset}
            />
          ) : (
            <AppearanceSettingsPanel
              resolvedTheme={resolvedTheme}
              themePreference={themePreference}
              onThemePreferenceChange={setThemePreference}
            />
          )}
        </div>
      </div>
    </ConverterDialogShell>
  );
}
