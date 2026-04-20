import type {
  FileConversionSettings,
  ManagedConversionFile,
} from "@/features/converter/types";
import type { DownloadableOutput } from "@/platform/output/types";
import type { EngineCapabilities } from "@/platform/converter/engine";
import { canPreviewFile } from "@/features/converter/preview-rules";
import { BatchActions } from "./BatchActions";
import { FileRow } from "./FileRow";

interface FileListProps {
  files: ManagedConversionFile[];
  capabilities: EngineCapabilities;
  canConvertAll: boolean;
  canDownloadAll: boolean;
  downloadsByFileId: Record<string, DownloadableOutput>;
  settingsByFileId: Record<string, FileConversionSettings>;
  onConvert: (fileId: string) => void;
  onConvertAll: () => void;
  onDownload: (fileId: string) => void | Promise<void>;
  onDownloadAll: () => void | Promise<void>;
  onClearAll: () => void;
  onOpenPreview: (fileId: string) => void;
  onOpenSettings: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

export function FileList({
  files,
  capabilities,
  canConvertAll,
  canDownloadAll,
  downloadsByFileId,
  settingsByFileId,
  onConvert,
  onConvertAll,
  onDownload,
  onDownloadAll,
  onClearAll,
  onOpenPreview,
  onOpenSettings,
  onRemove,
}: FileListProps) {
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <FileRow
          key={file.id}
          canConvert={file.status !== "done" && file.status !== "converting"}
          file={file}
          canPreview={canPreviewFile(file)}
          canDownload={
            Boolean(downloadsByFileId[file.id]) && file.status === "done"
          }
          capabilities={capabilities}
          settings={settingsByFileId[file.id]}
          onConvert={() => onConvert(file.id)}
          onDownload={() => onDownload(file.id)}
          onOpenPreview={() => onOpenPreview(file.id)}
          onOpenSettings={() => onOpenSettings(file.id)}
          onRemove={() => onRemove(file.id)}
        />
      ))}

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
