import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
import type { LogEventCallback, ProgressEventCallback } from "@ffmpeg/ffmpeg";
import { getMimeTypeForFormat } from "./mime-types";
import {
  buildArgs,
  buildOutputName,
  getInputExtension,
  normalizeFormat,
} from "./wasm-args";
import {
  assertSupportedFormat,
  assertWithinWasmLimits,
  buildFfmpegFailureMessage,
} from "./wasm-errors";
import type {
  ConvertProgress,
  ConvertRequest,
  ConvertResult,
  ConverterEngine,
  EngineCapabilities,
} from "./engine";

const WASM_ENGINE_CAPABILITIES: EngineCapabilities = {
  runtime: "web-wasm",
  label: "Browser FFmpeg WASM",
  outputs: {
    image: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"],
    audio: ["mp3", "wav", "aac", "ogg", "flac", "m4a"],
    video: ["original"],
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
      quality: false,
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
    "Browser video keeps the original format to avoid unreliable heavy transcoding.",
  ],
};

export class WasmEngine implements ConverterEngine {
  readonly capabilities = WASM_ENGINE_CAPABILITIES;

  private ffmpeg: FFmpeg | null = null;
  private loadPromise: Promise<void> | null = null;
  private conversionQueue: Promise<unknown> = Promise.resolve();
  private activeJobId: string | null = null;
  private cancelledJobIds = new Set<string>();

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

  async cancel(jobId: string) {
    this.cancelledJobIds.add(jobId);

    if (this.activeJobId !== jobId) {
      return;
    }

    const activeFfmpeg = this.ffmpeg;
    this.activeJobId = null;
    this.ffmpeg = null;
    this.loadPromise = null;
    this.conversionQueue = Promise.resolve();
    activeFfmpeg?.terminate();
  }

  private async convertInternal(
    request: ConvertRequest,
    onProgress?: (progress: ConvertProgress) => void,
  ) {
    this.throwIfCancelled(request.jobId);

    const sourceFile = request.file;
    if (!sourceFile) {
      throw new Error("Browser conversion requires a browser File object.");
    }

    onProgress?.({ phase: "loading", message: "Loading FFmpeg..." });
    await this.init();
    this.throwIfCancelled(request.jobId);

    if (!this.ffmpeg) {
      throw new Error("Wasm engine failed to initialize.");
    }

    const requestedFormat = normalizeFormat(request.outputFormat);
    const format =
      requestedFormat === "original"
        ? getInputExtension(request.fileName)
        : requestedFormat;
    assertSupportedFormat(request.kind, format);
    assertWithinWasmLimits(request);
    this.throwIfCancelled(request.jobId);

    onProgress?.({ phase: "preparing", message: "Preparing file..." });

    const inputName = `input.${getInputExtension(request.fileName)}`;
    const fsOutputName = `output.${format}`;
    const outputName = buildOutputName(request.fileName, format);
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

    const ffmpeg = this.ffmpeg;
    if (!ffmpeg) {
      throw new Error("Wasm engine failed to initialize.");
    }

    this.activeJobId = request.jobId;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));
      ffmpeg.on("progress", progressHandler);
      ffmpeg.on("log", logHandler);

      onProgress?.({ phase: "converting", message: "Converting..." });

      const args = buildArgs(inputName, fsOutputName, request, format);
      let exitCode = 0;

      try {
        exitCode = await ffmpeg.exec(args);
      } catch (error) {
        throw new Error(
          buildFfmpegFailureMessage(
            request,
            format,
            logMessages,
            undefined,
            error,
          ),
        );
      }

      if (exitCode !== 0) {
        throw new Error(
          buildFfmpegFailureMessage(request, format, logMessages, exitCode),
        );
      }

      const data = await ffmpeg.readFile(fsOutputName);
      const bytes =
        typeof data === "string"
          ? new TextEncoder().encode(data)
          : new Uint8Array(data);
      const mimeType = getMimeTypeForFormat(format);

      onProgress?.({ phase: "done", message: "Done." });

      return {
        blob: new Blob([bytes.buffer], { type: mimeType }),
        fileName: outputName,
        mimeType,
      };
    } finally {
      try {
        ffmpeg.off("progress", progressHandler);
        ffmpeg.off("log", logHandler);
      } catch {
        // The worker may already be terminated by cancellation.
      }

      if (this.ffmpeg === ffmpeg) {
        await this.deleteIfExists(ffmpeg, inputName);
        await this.deleteIfExists(ffmpeg, fsOutputName);
      }

      if (this.activeJobId === request.jobId) {
        this.activeJobId = null;
      }

      this.cancelledJobIds.delete(request.jobId);
    }
  }

  private async load() {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    this.ffmpeg = ffmpeg;
  }

  private throwIfCancelled(jobId: string) {
    if (this.cancelledJobIds.has(jobId)) {
      this.cancelledJobIds.delete(jobId);
      throw new Error("Conversion cancelled.");
    }
  }

  private async deleteIfExists(ffmpeg: FFmpeg, path: string) {
    try {
      await ffmpeg.deleteFile(path);
    } catch {
      // The file may not exist after a failed conversion.
    }
  }
}
