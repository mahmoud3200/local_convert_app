import type { ConvertRequest } from "./engine";

export function buildArgs(
  inputName: string,
  outputName: string,
  request: ConvertRequest,
  format: string,
) {
  if (request.kind === "image") {
    return buildImageArgs(inputName, outputName, request, format);
  }

  if (request.kind === "audio") {
    return buildAudioArgs(inputName, outputName, request, format);
  }

  return buildVideoArgs(inputName, outputName, request, format);
}

export function buildOutputName(inputName: string, outputFormat: string) {
  const base = inputName.replace(/\.[^/.]+$/, "");
  return `${base}.${outputFormat}`;
}

export function normalizeFormat(format: string) {
  return format.toLowerCase();
}

export function getInputExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "bin";
}

function buildImageArgs(
  inputName: string,
  outputName: string,
  request: ConvertRequest,
  format: string,
): string[] {
  const args = ["-i", inputName, "-map", "0:v:0", "-an", "-sn", "-dn"];
  const filters = buildVisualFilters(request, format);

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
    args.push("-q:v", String(toFfmpegQuality(request.options?.quality)));
  } else if (format === "png") {
    args.push(
      "-compression_level",
      String(toPngCompression(request.options?.quality)),
    );
  } else if (format === "webp") {
    args.push(
      "-c:v",
      "libwebp",
      "-quality",
      String(toPercentQuality(request.options?.quality)),
    );
  } else if (format === "avif") {
    args.push(
      "-c:v",
      "libaom-av1",
      "-crf",
      String(toAvifCrf(request.options?.quality)),
    );
  }

  args.push(outputName);
  return args;
}

function buildAudioArgs(
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

function buildVideoArgs(
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

  const filters = buildVisualFilters(request, format);

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

function buildVisualFilters(request: ConvertRequest, format: string) {
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
        String(toFfmpegQuality(request.options?.quality)),
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
  const canKeepSameContainer = format === inputExtension;
  const canSafelyRemuxToMp4 =
    format === "mp4" && ["mp4", "m4v", "mov"].includes(inputExtension);

  return (
    (canKeepSameContainer || canSafelyRemuxToMp4) &&
    !(
      request.options?.width ||
      request.options?.height ||
      request.options?.fps ||
      request.options?.bitrate
    )
  );
}

function toPercentQuality(quality = 88) {
  return clamp(Math.round(quality), 1, 100);
}

function toFfmpegQuality(quality = 88) {
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
