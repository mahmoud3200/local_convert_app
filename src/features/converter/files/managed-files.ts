import { MAX_MEDIA_URL_FILE_SIZE_BYTES } from "@/features/converter/constants";
import { loadMediaDimensions } from "@/platform/preview/media-dimensions";
import { formatBytes } from "./file-formatting";
import {
  getDetectedFileInfo,
  getDetectedFileInfoFromName,
} from "./format-support";
import type { EngineCapabilities } from "@/platform/converter/engine";
import type { NativeSelectedFile } from "@/platform/files/types";
import type { ManagedConversionFile } from "../types";

interface ManagedFileBase {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  kind: ManagedConversionFile["kind"];
  previewUrl: string | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
}

function createManagedFile(
  base: ManagedFileBase,
  overrides: Pick<
    ManagedConversionFile,
    "nativePath" | "previewUrl" | "shouldRevokePreviewUrl"
  >,
): ManagedConversionFile {
  return {
    id: base.id,
    name: base.name,
    size: base.size,
    sizeLabel: formatBytes(base.size),
    type: base.type || base.extension.toUpperCase() || "Unknown",
    kind: base.kind,
    extension: base.extension,
    previewUrl: overrides.previewUrl,
    shouldRevokePreviewUrl: overrides.shouldRevokePreviewUrl,
    naturalWidth: base.naturalWidth ?? null,
    naturalHeight: base.naturalHeight ?? null,
    status: "ready",
    ...(overrides.nativePath ? { nativePath: overrides.nativePath } : {}),
  };
}

export function createManagedFileFromBrowserFile(
  file: File,
  capabilities?: EngineCapabilities,
) {
  const detected = getDetectedFileInfo(file, capabilities);

  if (detected.kind === "unknown") {
    return null;
  }

  const previewUrl =
    detected.kind === "image" && file.size <= MAX_MEDIA_URL_FILE_SIZE_BYTES
      ? URL.createObjectURL(file)
      : null;

  return {
    ...createManagedFile(
      {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        extension: detected.extension,
        kind: detected.kind,
        previewUrl,
      },
      {
        previewUrl,
        shouldRevokePreviewUrl: Boolean(previewUrl),
      },
    ),
    file,
  } satisfies ManagedConversionFile;
}

export function createManagedFileFromNativeFile(
  file: NativeSelectedFile,
  capabilities?: EngineCapabilities,
) {
  const detected = getDetectedFileInfoFromName(
    file.name,
    file.type,
    capabilities,
  );

  if (detected.kind === "unknown") {
    return null;
  }

  return createManagedFile(
    {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type ?? "",
      extension: detected.extension,
      kind: detected.kind,
      previewUrl: file.previewUrl,
    },
    {
      nativePath: file.path,
      previewUrl: file.previewUrl,
      shouldRevokePreviewUrl: false,
    },
  );
}

export function getSkippedFilesMessage(rejectedCount: number) {
  return `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped because the type is not supported.`;
}

export async function loadManagedFileDimensions(
  file: ManagedConversionFile,
  getVideoUrl: () => { shouldRevoke: boolean; url: string } | null,
) {
  if (file.kind === "image") {
    if (!file.previewUrl) {
      return null;
    }

    return loadMediaDimensions("image", file.previewUrl);
  }

  if (file.kind !== "video") {
    return null;
  }

  const source = file.previewUrl
    ? { shouldRevoke: false, url: file.previewUrl }
    : getVideoUrl();

  if (!source) {
    return null;
  }

  try {
    return await loadMediaDimensions("video", source.url);
  } finally {
    if (source.shouldRevoke) {
      URL.revokeObjectURL(source.url);
    }
  }
}
