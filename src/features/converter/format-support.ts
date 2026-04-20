import type {
  DetectedFileInfo,
  MediaKind,
  OutputFormat,
  SelectOptionValue,
  SupportedInputDefinition,
} from "./types";
import type { EngineCapabilities } from "@/platform/converter/engine";

export const SUPPORTED_INPUTS: Record<MediaKind, SupportedInputDefinition> = {
  image: {
    label: "Image",
    mimePrefixes: ["image/"],
    extensions: ["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp", "tif", "tiff"],
  },
  audio: {
    label: "Audio",
    mimePrefixes: ["audio/"],
    extensions: ["mp3", "wav", "aac", "ogg", "flac", "m4a"],
  },
  video: {
    label: "Video",
    mimePrefixes: ["video/"],
    extensions: ["mp4", "webm", "mov", "mkv", "avi"],
  },
};

export const IMAGE_FORMAT_OPTIONS = createFormatOptions("image");
export const AUDIO_FORMAT_OPTIONS = createFormatOptions("audio");
export const VIDEO_FORMAT_OPTIONS = createFormatOptions("video");

const DEFAULT_OUTPUT_FORMAT_BY_KIND: Record<MediaKind, OutputFormat> = {
  image: "png",
  audio: "mp3",
  video: "mp4",
};

export function getFormatOptionsForKind(
  kind: MediaKind,
  capabilities?: EngineCapabilities,
) {
  if (capabilities) {
    return createFormatOptionsFromExtensions(capabilities.outputs[kind]);
  }

  return createFormatOptionsFromExtensions(SUPPORTED_INPUTS[kind].extensions);
}

export function getDefaultOutputFormatForKind(
  kind: MediaKind,
  capabilities?: EngineCapabilities,
) {
  const formats = getFormatOptionsForKind(kind, capabilities).map(
    (option) => option.value,
  );
  const preferred = DEFAULT_OUTPUT_FORMAT_BY_KIND[kind];

  return formats.includes(preferred) ? preferred : formats[0];
}

export function isOutputFormatValidForKind(
  kind: MediaKind,
  format: OutputFormat,
  capabilities?: EngineCapabilities,
) {
  return getFormatOptionsForKind(kind, capabilities).some(
    (option) => option.value === format,
  );
}

export function getAcceptedFileTypes() {
  return getAllSupportedInputExtensions()
    .map((extension) => `.${extension}`)
    .join(",");
}

export function getAllSupportedInputExtensions() {
  return Object.values(SUPPORTED_INPUTS).flatMap(
    (definition) => definition.extensions,
  );
}

export function getSupportedUploadLabels() {
  return Object.values(SUPPORTED_INPUTS).map(
    (definition) => {
      const label = definition.label === "Audio" ? "Audio" : `${definition.label}s`;

      return `${label}: ${definition.extensions
        .map((extension) => extension.toUpperCase())
        .join(" / ")}`;
    },
  );
}

function createFormatOptions(kind: MediaKind): SelectOptionValue<OutputFormat>[] {
  return createFormatOptionsFromExtensions(SUPPORTED_INPUTS[kind].extensions);
}

function createFormatOptionsFromExtensions(
  extensions: string[],
): SelectOptionValue<OutputFormat>[] {
  return extensions.map((extension) => ({
    label: extension.toUpperCase(),
    value: extension as OutputFormat,
  }));
}

export function getDetectedFileInfo(file: File): DetectedFileInfo {
  return getDetectedFileInfoFromName(file.name, file.type);
}

export function getDetectedFileInfoFromName(
  fileName: string,
  mimeType = "",
): DetectedFileInfo {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  for (const [kind, definition] of Object.entries(SUPPORTED_INPUTS) as Array<
    [MediaKind, SupportedInputDefinition]
  >) {
    const matchesMime = definition.mimePrefixes.some((prefix) => mimeType.startsWith(prefix));
    const matchesExtension = definition.extensions.includes(extension);

    if (matchesMime || matchesExtension) {
      return {
        kind,
        extension,
        label: definition.label,
      };
    }
  }

  return {
    kind: "unknown",
    extension,
    label: "Unknown file",
  };
}
