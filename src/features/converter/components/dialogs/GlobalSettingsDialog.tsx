import { Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFormatOptionsForKind } from "@/features/converter/files/format-support";
import { useGlobalSettingsDialog } from "@/features/converter/hooks/useGlobalSettingsDialog";
import { cn } from "@/lib/utils";
import { SettingsOverlayFrame } from "../settings/overlay/SettingsOverlayFrame";
import { SettingsSections } from "../settings/overlay/SettingsSections";
import type {
  AdvancedSettings,
  FileConversionSettings,
  MediaKind,
} from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

interface GlobalSettingsDialogProps {
  defaultSettingsByKind: Record<MediaKind, FileConversionSettings>;
  capabilities: EngineCapabilities;
  onClose: () => void;
  onSaveDefaultSettings: (
    kind: MediaKind,
    settings: FileConversionSettings,
  ) => void;
  onSaved?: () => void;
}

const tabs = [
  { id: "image", label: "Images" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
] as const;

export function GlobalSettingsDialog({
  defaultSettingsByKind,
  capabilities,
  onClose,
  onSaveDefaultSettings,
  onSaved,
}: GlobalSettingsDialogProps) {
  const {
    activeTab,
    draftSettingsByKind,
    hasAnyDraftChanges,
    saveAllChangedDefaults,
    setActiveTab,
    updateAdvanced,
    updateFormat,
  } = useGlobalSettingsDialog({
    defaultSettingsByKind,
    onSaveDefaultSettings,
    capabilities,
  });

  function handleSave() {
    const didSave = saveAllChangedDefaults();

    if (didSave) {
      onSaved?.();
      onClose();
    }
  }

  function handleAdvancedChange<Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) {
    updateAdvanced(activeTab, key, value);
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
            disabled={!hasAnyDraftChanges}
            onClick={handleSave}
          >
            <Check aria-hidden="true" className="h-[15px] w-[15px]" />
            Save
          </Button>
        </>
      }
      headerAside={
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              aria-pressed={activeTab === tab.id}
              className={cn(
                "h-7 rounded-full border px-3 text-[12px] font-medium transition outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20",
                activeTab === tab.id
                  ? "border-app-accent/31 bg-app-accent/[0.08] text-app-accent"
                  : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white",
              )}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
      icon={<SlidersHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />}
      subtitle="Defaults applied to new uploads"
      title="Preferences"
      onClose={onClose}
    >
      <SettingsSections
        capabilities={capabilities}
        formatOptions={getFormatOptionsForKind(activeTab, capabilities)}
        kind={activeTab}
        settings={draftSettingsByKind[activeTab]}
        onAdvancedChange={handleAdvancedChange}
        onFormatChange={(format) => updateFormat(activeTab, format)}
      />
    </SettingsOverlayFrame>
  );
}
