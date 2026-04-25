import { ExternalLink, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY } from "@/features/converter/constants";
import { PROJECT_GITHUB_URL } from "@/features/converter/constants";
import { useToast } from "@/hooks/useToast";
import { useConverterWorkspace } from "@/features/converter/hooks/useConverterWorkspace";
import { useDismissedFlag } from "@/features/converter/hooks/useDismissedFlag";
import { useThemePreference } from "@/features/converter/hooks/useThemePreference";
import { ConverterHeader } from "./ConverterHeader";
import { DesktopAppCallout } from "./DesktopAppCallout";
import { FfmpegDesktopNotice } from "./FfmpegDesktopNotice";
import { FileList } from "../file-list/FileList";
import { FilePreviewDialog } from "../dialogs/FilePreviewDialog";
import { FileSettingsDialog } from "../dialogs/FileSettingsDialog";
import { GlobalSettingsDialog } from "../dialogs/GlobalSettingsDialog";
import { UploadDropzone } from "./UploadDropzone";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

interface ConverterScreenProps {
  platform: ConverterPlatformServices;
}

export function ConverterScreen({ platform }: ConverterScreenProps) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [settingsFileId, setSettingsFileId] = useState<string | null>(null);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const workspace = useConverterWorkspace(platform);
  const theme = useThemePreference();
  const toast = useToast();
  const ffmpegNotice = useDismissedFlag(
    FFMPEG_DESKTOP_NOTICE_DISMISSED_STORAGE_KEY,
  );

  const previewFile = previewFileId ? workspace.getFile(previewFileId) : null;
  const settingsFile = settingsFileId
    ? workspace.getFile(settingsFileId)
    : null;

  function handleRemove(fileId: string) {
    workspace.actions.remove(fileId);

    if (previewFileId === fileId) {
      setPreviewFileId(null);
    }

    if (settingsFileId === fileId) {
      setSettingsFileId(null);
    }
  }

  function handleClearAll() {
    workspace.actions.clearAll();
    setPreviewFileId(null);
    setSettingsFileId(null);
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

  async function handleOpenPreview(fileId: string) {
    try {
      await workspace.actions.preparePreview(fileId);
    } catch (error) {
      console.error(error);
    }

    setPreviewFileId(fileId);
  }

  async function handleOpenRepository() {
    try {
      await platform.openExternalUrl(PROJECT_GITHUB_URL);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not open the project repository.",
      );
    }
  }

  return (
    <>
      <ConverterHeader />

      <section className="surface-panel p-5 md:p-6 shadow-m">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-accent">
              Converter
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-app-fg">
              Start converting your files
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              Upload multiple files, adjust settings individually, and convert
              them in seconds.
            </p>
          </div>

          <UploadDropzone
            accept={workspace.acceptedFileTypes}
            helperMessage={workspace.message}
            isNativeBrowseEnabled={workspace.usesNativeFilePicker}
            supportLabels={workspace.supportedUploadLabels}
            onFilesSelect={workspace.actions.addFiles}
            onNativeBrowse={handleNativeBrowse}
          />

          <DesktopAppCallout isVisible={!workspace.usesNativeFilePicker} />
          <FfmpegDesktopNotice
            isVisible={
              workspace.usesNativeFilePicker && !ffmpegNotice.isDismissed
            }
            onDismiss={ffmpegNotice.dismiss}
          />

          {workspace.files.length > 0 ? (
            <FileList
              files={workspace.files}
              canConvertAll={workspace.canConvertAll}
              canDownloadAll={workspace.canDownloadAll}
              downloadsByFileId={workspace.downloadsByFileId}
              capabilities={workspace.capabilities}
              settingsByFileId={workspace.settingsByFileId}
              onConvert={workspace.actions.convert}
              onConvertAll={workspace.actions.convertAll}
              onDownload={workspace.actions.download}
              onDownloadAll={workspace.actions.downloadAll}
              onClearAll={handleClearAll}
              onOpenPreview={handleOpenPreview}
              onOpenSettings={setSettingsFileId}
              onRemove={handleRemove}
            />
          ) : (
            <div className="rounded-panel border border-dashed border-app-border bg-app-subtle px-4 py-10 text-center text-sm text-app-muted shadow-s">
              Your files will appear here once added
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-4 left-4 z-30 flex flex-col gap-2 md:bottom-6 md:left-6">
        <Button variant="secondary" onClick={handleOpenRepository}>
          <ExternalLink className="h-4 w-4" />
          GitHub
        </Button>
        <Button
          variant="secondary"
          onClick={() => setIsGlobalSettingsOpen(true)}
        >
          <Settings2 className="h-4 w-4" />
          Preferences
        </Button>
      </div>

      {settingsFile ? (
        <FileSettingsDialog
          file={settingsFile}
          capabilities={workspace.capabilities}
          settings={workspace.getSettings(settingsFile.id)!}
          onClose={() => setSettingsFileId(null)}
          onSaved={() => toast.success("Saved")}
          onSave={workspace.actions.saveSettings}
        />
      ) : null}

      {isGlobalSettingsOpen ? (
        <GlobalSettingsDialog
          defaultSettingsByKind={workspace.defaultSettingsByKind}
          capabilities={workspace.capabilities}
          resolvedTheme={theme.resolvedTheme}
          themePreference={theme.themePreference}
          onClose={() => setIsGlobalSettingsOpen(false)}
          onSaved={() => toast.success("Saved")}
          onSaveDefaultSettings={workspace.actions.saveDefaultSettings}
          onThemePreferenceChange={theme.setThemePreference}
        />
      ) : null}

      <FilePreviewDialog
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFileId(null)}
      />
    </>
  );
}
