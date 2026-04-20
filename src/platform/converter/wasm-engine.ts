import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
import type { LogEventCallback, ProgressEventCallback } from "@ffmpeg/ffmpeg";
import type {
  ConvertProgress,
  ConvertRequest,
  ConvertResult,
  ConverterEngine,
  EngineCapabilities,
  MediaKind,
} from "./engine";

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

const VIDEO_OUTPUT_FORMATS = new Set([
  "mp4",
]);
const WASM_VIDEO_TRANSCODE_LIMIT_BYTES = 150 * 1024 * 1024;

export const WASM_ENGINE_CAPABILITIES: EngineCapabilities = {
  runtime: "web-wasm",
  label: "Browser FFmpeg WASM",
  outputs: {
    image: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"],
    audio: ["mp3", "wav", "aac", "ogg", "flac", "m4a"],
    video: ["mp4"],
  },
  advancedSettings: {
    image: {
      quality: true,
      compression: true,
      resolution: true,
      bitrate: false,
      frameRate: false,
      sampleRate: false,
      channels: false,
      metadata: true,
    },
    audio: {
      quality: true,
      compression: false,
      resolution: false,
      bitrate: true,
      frameRate: false,
      sampleRate: true,
      channels: true,
      metadata: true,
    },
    video: {
      quality: false,
      compression: false,
      resolution: false,
      bitrate: false,
      frameRate: false,
      sampleRate: false,
      channels: false,
      metadata: true,
    },
  },
  notes: [
    "AVIF output is disabled because the bundled WASM core does not include an AV1 encoder.",
    "Browser video output is intentionally limited to MP4 to avoid unreliable heavy transcoding.",
  ],
};

export class WasmEngine implements ConverterEngine {
  readonly capabilities = WASM_ENGINE_CAPABILITIES;

  private ffmpeg: FFmpeg | null = null;
  private loadPromise: Promise<void> | null = null;
  private conversionQueue: Promise<unknown> = Promise.resolve();

  async init() {
    if (this.ffmpeg?.loaded) {
      return;
    }

    this.loadPromise ??= this.load().catch((error) => {
      this.loadPromise = null;
      throw error;
    });
    await this.loadPromise;
  }

  async convert(
    request: ConvertRequest,
    onProgress?: (progress: ConvertProgress) => void,
  ): Promise<ConvertResult> {
    const conversion = this.conversionQueue.then(() =>
      this.convertInternal(request, onProgress),
    );

    this.conversionQueue = conversion.catch(() => undefined);
    return conversion;
  }

  private async convertInternal(
    request: ConvertRequest,
    onProgress?: (progress: ConvertProgress) => void,
  ) {
    const sourceFile = request.file;
    if (!sourceFile) {
      throw new Error("Browser conversion requires a browser File object.");
    }

    onProgress?.({ phase: "loading", message: "Loading FFmpeg..." });
    await this.init();

    if (!this.ffmpeg) {
      throw new Error("Wasm engine failed to initialize.");
    }

    const format = normalizeFormat(request.outputFormat);
    assertSupportedFormat(request.kind, format);
    assertWithinWasmLimits(request, format);

    onProgress?.({ phase: "preparing", message: "Preparing file..." });

    const inputName = `input.${getInputExtension(request.fileName)}`;
    const fsOutputName = `output.${format}`;
    const outputName = this.buildOutputName(request.fileName, format);
    const logMessages: string[] = [];
    const logHandler: LogEventCallback = ({ message }) => {
      const cleanMessage = message.trim();

      if (!cleanMessage) {
        return;
      }

      logMessages.push(cleanMessage);

      if (logMessages.length > 24) {
        logMessages.shift();
      }
    };
    const progressHandler: ProgressEventCallback = ({ progress }) => {
      onProgress?.({
        phase: "converting",
        ratio: progress,
        message: "Converting...",
      });
    };

    await this.ffmpeg.writeFile(inputName, await fetchFile(sourceFile));
    this.ffmpeg.on("progress", progressHandler);
    this.ffmpeg.on("log", logHandler);

    try {
      onProgress?.({ phase: "converting", message: "Converting..." });

      const args = this.buildArgs(inputName, fsOutputName, request, format);
      let exitCode = 0;

      try {
        exitCode = await this.ffmpeg.exec(args);
      } catch (error) {
        throw new Error(
          buildFfmpegFailureMessage(request, format, logMessages, undefined, error),
        );
      }

      if (exitCode !== 0) {
        throw new Error(buildFfmpegFailureMessage(request, format, logMessages, exitCode));
      }

      const data = await this.ffmpeg.readFile(fsOutputName);
      const bytes =
        typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
      const mimeType = this.getMimeType(format);

      onProgress?.({ phase: "done", message: "Done." });

      return {
        blob: new Blob([bytes.buffer], { type: mimeType }),
        fileName: outputName,
        mimeType,
      };
    } finally {
      this.ffmpeg.off("progress", progressHandler);
      this.ffmpeg.off("log", logHandler);
      await this.deleteIfExists(inputName);
      await this.deleteIfExists(fsOutputName);
    }
  }

  private async load() {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    this.ffmpeg = ffmpeg;
  }

  private buildArgs(
    inputName: string,
    outputName: string,
    request: ConvertRequest,
    format: string,
  ) {
    if (request.kind === "image") {
      return this.buildImageArgs(inputName, outputName, request, format);
    }

    if (request.kind === "audio") {
      return this.buildAudioArgs(inputName, outputName, request, format);
    }

    return this.buildVideoArgs(inputName, outputName, request, format);
  }

  private buildImageArgs(
    inputName: string,
    outputName: string,
    request: ConvertRequest,
    format: string,
  ): string[] {
    const args = ["-i", inputName, "-map", "0:v:0", "-an", "-sn", "-dn"];
    const filters = this.buildVisualFilters(request, format);

    if (filters.length > 0) {
      args.push("-vf", filters.join(","));
    }

    if (format !== "gif") {
      args.push("-frames:v", "1");
    }

    if (request.options?.removeMetadata) {
      args.push("-map_metadata", "-1");
    }

    if (format === "jpg" || format === "jpeg") {
      args.push("-q:v", String(toJpegQuality(request.options?.quality)));
    } else if (format === "png") {
      args.push("-compression_level", String(toPngCompression(request.options?.quality)));
    } else if (format === "webp") {
      args.push("-c:v", "libwebp", "-quality", String(toPercentQuality(request.options?.quality)));
    } else if (format === "avif") {
      args.push("-c:v", "libaom-av1", "-crf", String(toAvifCrf(request.options?.quality)));
    }

    args.push(outputName);
    return args;
  }

  private buildAudioArgs(
    inputName: string,
    outputName: string,
    request: ConvertRequest,
    format: string,
  ): string[] {
    const args = ["-i", inputName, "-map", "0:a:0", "-vn", "-sn", "-dn"];

    if (request.options?.removeMetadata) {
      args.push("-map_metadata", "-1");
    }

    args.push(...getAudioCodecArgs(format));

    const bitrate = getAudioBitrate(request);
    if (bitrate && format !== "wav" && format !== "flac") {
      args.push("-b:a", bitrate);
    }

    if (request.options?.sampleRate) {
      args.push("-ar", String(request.options.sampleRate));
    }

    if (request.options?.channels) {
      args.push("-ac", String(request.options.channels));
    }

    args.push(outputName);
    return args;
  }

  private buildVideoArgs(
    inputName: string,
    outputName: string,
    request: ConvertRequest,
    format: string,
  ): string[] {
    const args = ["-i", inputName, "-map", "0:v:0", "-map", "0:a?", "-sn", "-dn"];

    if (canCopyVideoStreams(request, format)) {
      if (request.options?.removeMetadata) {
        args.push("-map_metadata", "-1");
      }

      args.push("-c", "copy");

      if (format === "mp4" || format === "mov") {
        args.push("-movflags", "faststart");
      }

      args.push(outputName);
      return args;
    }

    const filters = this.buildVisualFilters(request, format);

    if (filters.length > 0) {
      args.push("-vf", filters.join(","));
    }

    if (request.options?.removeMetadata) {
      args.push("-map_metadata", "-1");
    }

    if (request.options?.fps) {
      args.push("-r", String(request.options.fps));
    }

    args.push(...getVideoCodecArgs(format, request));

    const videoBitrate = getVideoBitrate(request);
    if (videoBitrate) {
      args.push("-b:v", videoBitrate);
    }

    if (format === "mp4" || format === "mov") {
      args.push("-movflags", "faststart");
    }

    args.push(outputName);
    return args;
  }

  private buildVisualFilters(request: ConvertRequest, format: string) {
    const filters: string[] = [];
    const width = request.options?.width;
    const height = request.options?.height;

    if (width || height) {
      filters.push(`scale=${width ?? -2}:${height ?? -2}`);
    }

    if (format === "jpg" || format === "jpeg" || request.kind === "video") {
      filters.push("format=yuv420p");
    }

    return filters;
  }

  private buildOutputName(inputName: string, outputFormat: string) {
    const base = inputName.replace(/\.[^/.]+$/, "");
    return `${base}.${outputFormat}`;
  }

  private async deleteIfExists(path: string) {
    if (!this.ffmpeg) {
      return;
    }

    try {
      await this.ffmpeg.deleteFile(path);
    } catch {
      // The file may not exist after a failed conversion.
    }
  }

  private getMimeType(format: string) {
    switch (format) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "avif":
        return "image/avif";
      case "gif":
        return "image/gif";
      case "bmp":
        return "image/bmp";
      case "tif":
      case "tiff":
        return "image/tiff";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "aac":
        return "audio/aac";
      case "ogg":
        return "audio/ogg";
      case "flac":
        return "audio/flac";
      case "m4a":
        return "audio/mp4";
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mov":
        return "video/quicktime";
      case "mkv":
        return "video/x-matroska";
      case "avi":
        return "video/x-msvideo";
      default:
        return "application/octet-stream";
    }
  }
}

function assertSupportedFormat(kind: MediaKind, format: string) {
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

function assertWithinWasmLimits(request: ConvertRequest, format: string) {
  if (
    request.kind === "video" &&
    !canCopyVideoStreams(request, format) &&
    request.fileSize > WASM_VIDEO_TRANSCODE_LIMIT_BYTES
  ) {
    throw new Error(
      "This video is too large for reliable browser WASM transcoding. Use the desktop Tauri engine for large video files.",
    );
  }
}

function buildFfmpegFailureMessage(
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

  if (/memory access out of bounds|cannot enlarge memory|out of memory/i.test(logText)) {
    return "The browser FFmpeg WASM runtime ran out of memory while processing this file. Try a smaller file or use the desktop Tauri engine for heavy video conversion.";
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

  if (/memory access out of bounds|cannot enlarge memory|out of memory/i.test(causeMessage)) {
    return "The browser FFmpeg WASM runtime ran out of memory while processing this file. Try a smaller file or use the desktop Tauri engine for heavy video conversion.";
  }

  const exitMessage =
    typeof exitCode === "number" ? ` FFmpeg exited with code ${exitCode}.` : "";
  const detail = lastLog || causeMessage;

  return `FFmpeg could not create ${format.toUpperCase()} output.${exitMessage}${
    detail ? ` Last message: ${detail}` : ""
  }`;
}

function getLastUsefulLog(logs: string[]) {
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const message = logs[index];

    if (!message.startsWith("configuration:")) {
      return message;
    }
  }

  return "";
}

function getAudioCodecArgs(format: string) {
  switch (format) {
    case "mp3":
      return ["-c:a", "libmp3lame"];
    case "wav":
      return ["-c:a", "pcm_s16le"];
    case "aac":
    case "m4a":
      return ["-c:a", "aac"];
    case "ogg":
      return ["-c:a", "libvorbis"];
    case "flac":
      return ["-c:a", "flac"];
    default:
      return [];
  }
}

function getVideoCodecArgs(format: string, request: ConvertRequest) {
  const crf = String(toVideoCrf(request.options?.quality));

  switch (format) {
    case "webm":
      return [
        "-c:v",
        "libvpx-vp9",
        "-crf",
        crf,
        ...(getVideoBitrate(request) ? [] : ["-b:v", "0"]),
        "-c:a",
        "libopus",
      ];
    case "avi":
      return [
        "-c:v",
        "mpeg4",
        "-q:v",
        String(toMpeg4Quality(request.options?.quality)),
        "-c:a",
        "libmp3lame",
      ];
    default:
      return [
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        crf,
        "-c:a",
        "aac",
      ];
  }
}

function getAudioBitrate(request: ConvertRequest) {
  const bitrate = request.options?.bitrate;
  return bitrate ? `${bitrate}k` : null;
}

function getVideoBitrate(request: ConvertRequest) {
  const bitrate = request.options?.bitrate;
  return bitrate ? `${bitrate}M` : null;
}

function canCopyVideoStreams(request: ConvertRequest, format: string) {
  const inputExtension = getInputExtension(request.fileName);
  const canSafelyRemuxToMp4 =
    format === "mp4" && ["mp4", "m4v", "mov"].includes(inputExtension);

  return canSafelyRemuxToMp4 && !(
    request.options?.width ||
    request.options?.height ||
    request.options?.fps ||
    request.options?.bitrate
  );
}

function normalizeFormat(format: string) {
  return format.toLowerCase();
}

function getInputExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "bin";
}

function toPercentQuality(quality = 88) {
  return clamp(Math.round(quality), 1, 100);
}

function toJpegQuality(quality = 88) {
  return clamp(Math.round(31 - (toPercentQuality(quality) / 100) * 29), 2, 31);
}

function toMpeg4Quality(quality = 88) {
  return clamp(Math.round(31 - (toPercentQuality(quality) / 100) * 29), 2, 31);
}

function toPngCompression(quality = 88) {
  return clamp(Math.round(9 - (toPercentQuality(quality) / 100) * 9), 0, 9);
}

function toAvifCrf(quality = 88) {
  return clamp(Math.round(63 - (toPercentQuality(quality) / 100) * 63), 0, 63);
}

function toVideoCrf(quality = 88) {
  return clamp(Math.round(51 - (toPercentQuality(quality) / 100) * 33), 18, 51);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
