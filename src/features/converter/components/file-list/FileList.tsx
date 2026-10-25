import type {
  FileConversionSettings,
  ManagedConversionFile,
  OutputFormat,
} from "@/features/converter/types";
import type { DownloadableOutput } from "@/platform/output/types";
import type { EngineCapabilities } from "@/platform/converter/engine";
import { AddMoreFiles } from "./AddMoreFiles";
import { BatchActions } from "./BatchActions";
import { FileRow } from "./FileRow";

interface FileListProps {
  accept: string;
  capabilities: EngineCapabilities;
  canConvertAll: boolean;
  canDownloadAll: boolean;
  downloadsByFileId: Record<string, DownloadableOutput>;
  files: ManagedConversionFile[];
  isNativeBrowseEnabled: boolean;
  settingsByFileId: Record<string, FileConversionSettings>;
  onClearAll: () => void;
  onConvert: (fileId: string) => void;
  onConvertAll: () => void;
  onDownload: (fileId: string) => void | Promise<void>;
  onDownloadAll: () => void | Promise<void>;
  onFilesSelect: (files: FileList | File[]) => void;
  onFormatChange: (fileId: string, format: OutputFormat) => void;
  onNativeBrowse?: () => void | Promise<void>;
  onOpenSettings: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

export function FileList({
  accept,
  capabilities,
  canConvertAll,
  canDownloadAll,
  downloadsByFileId,
  files,
  isNativeBrowseEnabled,
  settingsByFileId,
  onClearAll,
  onConvert,
  onConvertAll,
  onDownload,
  onDownloadAll,
  onFilesSelect,
  onFormatChange,
  onNativeBrowse,
  onOpenSettings,
  onRemove,
}: FileListProps) {
  return (
    <div className="flex flex-col gap-4">
      {files.map((file) => (
        <FileRow
          key={file.id}
          canConvert={file.status !== "done" && file.status !== "converting"}
          file={file}
          canDownload={
            Boolean(downloadsByFileId[file.id]) && file.status === "done"
          }
          capabilities={capabilities}
          settings={settingsByFileId[file.id]}
          onConvert={() => onConvert(file.id)}
          onDownload={() => onDownload(file.id)}
          onFormatChange={(format) => onFormatChange(file.id, format)}
          onOpenSettings={() => onOpenSettings(file.id)}
          onRemove={() => onRemove(file.id)}
        />
      ))}

      <AddMoreFiles
        accept={accept}
        isNativeBrowseEnabled={isNativeBrowseEnabled}
        onFilesSelect={onFilesSelect}
        onNativeBrowse={onNativeBrowse}
      />

      <BatchActions
        canConvertAll={canConvertAll}
        canDownloadAll={canDownloadAll}
        onClearAll={onClearAll}
        onConvertAll={onConvertAll}
        onDownloadAll={onDownloadAll}
      />
    </div>
  );
}
