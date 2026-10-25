import type {
  DetectedFileInfo,
  MediaKind,
  OutputFormat,
  SelectOptionValue,
  SupportedInputDefinition,
} from "../types";
import type { EngineCapabilities } from "@/platform/converter/engine";

const SUPPORTED_INPUTS: Record<MediaKind, SupportedInputDefinition> = {
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

const WEB_WASM_UNSUPPORTED_INPUT_EXTENSIONS = new Set(["avif"]);

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

export function getAcceptedFileTypes(capabilities?: EngineCapabilities) {
  return getAllSupportedInputExtensions(capabilities)
    .map((extension) => `.${extension}`)
    .join(",");
}

export function getAllSupportedInputExtensions(capabilities?: EngineCapabilities) {
  return Object.values(getSupportedInputs(capabilities)).flatMap(
    (definition) => definition.extensions,
  );
}

export function getSupportedUploadLabels(capabilities?: EngineCapabilities) {
  return Object.values(getSupportedInputs(capabilities)).map(
    (definition) => {
      const label = definition.label === "Audio" ? "Audio" : `${definition.label}s`;

      return `${label}: ${definition.extensions
        .map((extension) => extension.toUpperCase())
        .join(" / ")}`;
    },
  );
}

function createFormatOptionsFromExtensions(
  extensions: string[],
): SelectOptionValue<OutputFormat>[] {
  return extensions.map((extension) => ({
    label: extension === "original" ? "Original format" : extension.toUpperCase(),
    value: extension as OutputFormat,
  }));
}

export function getDetectedFileInfo(
  file: File,
  capabilities?: EngineCapabilities,
): DetectedFileInfo {
  return getDetectedFileInfoFromName(file.name, file.type, capabilities);
}

export function getDetectedFileInfoFromName(
  fileName: string,
  mimeType = "",
  capabilities?: EngineCapabilities,
): DetectedFileInfo {
  const extension = getFileExtension(fileName);
  const supportedInputs = getSupportedInputs(capabilities);

  for (const [kind, definition] of Object.entries(supportedInputs) as Array<
    [MediaKind, SupportedInputDefinition]
  >) {
    const matchesExtension = definition.extensions.includes(extension);

    if (matchesExtension) {
      return {
        kind,
        extension,
      };
    }
  }

  if (!extension) {
    for (const [kind, definition] of Object.entries(supportedInputs) as Array<
      [MediaKind, SupportedInputDefinition]
    >) {
      const matchesMime = definition.mimePrefixes.some((prefix) =>
        mimeType.startsWith(prefix),
      );

      if (matchesMime) {
        return {
          kind,
          extension,
        };
      }
    }
  }

  return {
    kind: "unknown",
    extension,
  };
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function getSupportedInputs(
  capabilities?: EngineCapabilities,
): Record<MediaKind, SupportedInputDefinition> {
  if (capabilities?.runtime !== "web-wasm") {
    return SUPPORTED_INPUTS;
  }

  return Object.fromEntries(
    Object.entries(SUPPORTED_INPUTS).map(([kind, definition]) => [
      kind,
      {
        ...definition,
        extensions: definition.extensions.filter(
          (extension) => !WEB_WASM_UNSUPPORTED_INPUT_EXTENSIONS.has(extension),
        ),
      },
    ]),
  ) as Record<MediaKind, SupportedInputDefinition>;
}
