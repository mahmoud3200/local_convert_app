import { useState } from "react";
import { FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY } from "@/features/converter/constants";
import { useToast } from "@/hooks/useToast";
import { useConverterWorkspace } from "@/features/converter/hooks/useConverterWorkspace";
import { useDismissedFlag } from "@/features/converter/hooks/useDismissedFlag";
import { useGlobalFileDrop } from "@/features/converter/hooks/useGlobalFileDrop";
import { usePlatformLinks } from "@/features/converter/hooks/usePlatformLinks";
import type { OutputFormat } from "@/features/converter/types";
import type { ConverterPlatformServices } from "@/platform/converter-platform";
import { FileList } from "../file-list/FileList";
import { ConverterBackdrop } from "./ConverterBackdrop";
import { ConverterDialogs } from "./ConverterDialogs";
import { ConverterHeader } from "./ConverterHeader";
import { FfmpegDesktopNotice } from "./FfmpegDesktopNotice";
import { GlobalDropOverlay } from "./GlobalDropOverlay";
import { HomeHero } from "./HomeHero";
import { UploadDropzone } from "./UploadDropzone";

interface ConverterScreenProps {
  platform: ConverterPlatformServices;
}

export function ConverterScreen({ platform }: ConverterScreenProps) {
  const [settingsFileId, setSettingsFileId] = useState<string | null>(null);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const workspace = useConverterWorkspace(platform);
  const links = usePlatformLinks(platform);
  const toast = useToast();
  const isFileDragActive = useGlobalFileDrop(workspace.actions.addFiles);
  const ffmpegNotice = useDismissedFlag(
    FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY,
  );

  const settingsFile = settingsFileId
    ? workspace.getFile(settingsFileId)
    : null;
  const settingsFileSettings = settingsFile
    ? workspace.getSettings(settingsFile.id)
    : undefined;
  const hasFiles = workspace.files.length > 0;

  function handleRemove(fileId: string) {
    workspace.actions.remove(fileId);

    if (settingsFileId === fileId) {
      setSettingsFileId(null);
    }
  }

  function handleClearAll() {
    workspace.actions.clearAll();
    setSettingsFileId(null);
  }

  function handleFormatChange(fileId: string, format: OutputFormat) {
    const settings = workspace.getSettings(fileId);

    if (!settings) {
      return;
    }

    workspace.actions.saveSettings(fileId, { ...settings, format });
  }

  async function handleNativeBrowse() {
    try {
      await workspace.actions.browseNativeFiles();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not open the desktop file picker.",
      );
    }
  }

  return (
    <>
      <div className="relative z-10 flex flex-1 flex-col">
        <ConverterHeader
          showInstallApp={!workspace.usesNativeFilePicker}
          onInstallApp={links.openInstallApp}
          onOpenPreferences={() => setIsGlobalSettingsOpen(true)}
          onOpenRepository={links.openRepository}
        />

        <FfmpegDesktopNotice
          isVisible={
            workspace.usesNativeFilePicker && !ffmpegNotice.isDismissed
          }
          onDismiss={ffmpegNotice.dismiss}
        />

        <div className="my-auto flex flex-col gap-5 pt-[clamp(1.5rem,5dvh,4rem)]">
          <HomeHero />

          <div className="mt-[clamp(1.5rem,4.5dvh,4.5rem)]">
            {hasFiles ? (
              <>
                {workspace.message ? (
                  <p className="mb-4 text-sm text-app-error" role="status">
                    {workspace.message}
                  </p>
                ) : null}
                <FileList
                  accept={workspace.acceptedFileTypes}
                  capabilities={workspace.capabilities}
                  canConvertAll={workspace.canConvertAll}
                  canDownloadAll={workspace.canDownloadAll}
                  downloadsByFileId={workspace.downloadsByFileId}
                  files={workspace.files}
                  isNativeBrowseEnabled={workspace.usesNativeFilePicker}
                  settingsByFileId={workspace.settingsByFileId}
                  onClearAll={handleClearAll}
                  onConvert={workspace.actions.convert}
                  onConvertAll={workspace.actions.convertAll}
                  onDownload={workspace.actions.download}
                  onDownloadAll={workspace.actions.downloadAll}
                  onFilesSelect={workspace.actions.addFiles}
                  onFormatChange={handleFormatChange}
                  onNativeBrowse={handleNativeBrowse}
                  onOpenSettings={setSettingsFileId}
                  onRemove={handleRemove}
                />
              </>
            ) : (
              <UploadDropzone
                accept={workspace.acceptedFileTypes}
                helperMessage={workspace.message}
                isNativeBrowseEnabled={workspace.usesNativeFilePicker}
                onFilesSelect={workspace.actions.addFiles}
                onNativeBrowse={handleNativeBrowse}
              />
            )}
          </div>
        </div>
      </div>

      <ConverterBackdrop />

      <ConverterDialogs
        capabilities={workspace.capabilities}
        defaultSettingsByKind={workspace.defaultSettingsByKind}
        file={settingsFile}
        fileSettings={settingsFileSettings}
        isGlobalSettingsOpen={isGlobalSettingsOpen}
        onCloseFileSettings={() => setSettingsFileId(null)}
        onCloseGlobalSettings={() => setIsGlobalSettingsOpen(false)}
        onSaveDefaultSettings={workspace.actions.saveDefaultSettings}
        onSaveSettings={workspace.actions.saveSettings}
        onSaved={() => toast.success("Saved")}
      />

      <GlobalDropOverlay isVisible={isFileDragActive} />
    </>
  );
}
