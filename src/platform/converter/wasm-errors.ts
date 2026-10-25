import { getInputExtension } from "./wasm-args";
import type { ConvertRequest, MediaKind } from "./engine";

const IMAGE_OUTPUT_FORMATS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "tif",
  "tiff",
]);

const AUDIO_OUTPUT_FORMATS = new Set([
  "mp3",
  "wav",
  "aac",
  "ogg",
  "flac",
  "m4a",
]);

const VIDEO_OUTPUT_FORMATS = new Set(["mp4", "webm", "mov", "mkv", "avi"]);

const WASM_VIDEO_PROCESS_LIMIT_BYTES = 150 * 1024 * 1024;

const OUT_OF_MEMORY_PATTERN = /memory access out of bounds|cannot enlarge memory|out of memory/i;

export function assertSupportedFormat(kind: MediaKind, format: string) {
  if (kind === "image" && IMAGE_OUTPUT_FORMATS.has(format)) {
    return;
  }

  if (kind === "audio" && AUDIO_OUTPUT_FORMATS.has(format)) {
    return;
  }

  if (kind === "video" && VIDEO_OUTPUT_FORMATS.has(format)) {
    return;
  }

  throw new Error(`Unsupported ${kind} output format: ${format}`);
}

export function assertWithinWasmLimits(request: ConvertRequest) {
  if (
    request.kind === "video" &&
    request.fileSize > WASM_VIDEO_PROCESS_LIMIT_BYTES
  ) {
    throw new Error(
      "This video is too large for reliable browser processing. Use the desktop app for larger video files.",
    );
  }
}

export function buildFfmpegFailureMessage(
  request: ConvertRequest,
  format: string,
  logs: string[],
  exitCode?: number,
  cause?: unknown,
) {
  const logText = logs.join("\n");
  const lastLog = getLastUsefulLog(logs);
  const inputExtension = getInputExtension(request.fileName);

  if (format === "avif" && /libaom|av1|encoder/i.test(logText)) {
    return "AVIF export is not available in the bundled FFmpeg WASM core because it does not include an AV1 encoder. Use PNG, JPEG, or WebP for now.";
  }

  if (inputExtension === "avif" && /av1|decoder|invalid data/i.test(logText)) {
    return "This AVIF file could not be decoded by the bundled FFmpeg WASM core. AVIF support depends on the codecs compiled into the WASM build.";
  }

  if (OUT_OF_MEMORY_PATTERN.test(logText)) {
    return OUT_OF_MEMORY_MESSAGE;
  }

  const unknownEncoder = logText.match(/Unknown encoder '([^']+)'/i);
  if (unknownEncoder) {
    return `The bundled FFmpeg WASM core does not include the ${unknownEncoder[1]} encoder needed for ${format.toUpperCase()} output.`;
  }

  const causeMessage =
    cause instanceof Error
      ? cause.message
      : typeof cause === "string"
        ? cause
        : "";

  if (OUT_OF_MEMORY_PATTERN.test(causeMessage)) {
    return OUT_OF_MEMORY_MESSAGE;
  }

  const exitMessage =
    typeof exitCode === "number" ? ` FFmpeg exited with code ${exitCode}.` : "";
  const detail = lastLog || causeMessage;

  return `FFmpeg could not create ${format.toUpperCase()} output.${exitMessage}${
    detail ? ` Last message: ${detail}` : ""
  }`;
}

const OUT_OF_MEMORY_MESSAGE =
  "The browser FFmpeg WASM runtime ran out of memory while processing this file. Try a smaller file or use the desktop Tauri engine for heavy video conversion.";

function getLastUsefulLog(logs: string[]) {
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const message = logs[index];

    if (!message.startsWith("configuration:")) {
      return message;
    }
  }

  return "";
}
