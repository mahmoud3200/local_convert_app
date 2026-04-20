import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/platform/tauri-runtime";
import type {
  ConvertProgress,
  ConvertRequest,
  ConvertResult,
  ConverterEngine,
  EngineCapabilities,
} from "./engine";

type TauriConvertResponse = {
  bytes: number[];
  fileName: string;
  mimeType: string;
};

type TauriPathConvertResponse = {
  nativePath: string;
  fileName: string;
  mimeType: string;
};

export const TAURI_ENGINE_CAPABILITIES: EngineCapabilities = {
  runtime: "tauri-native",
  label: "Desktop native FFmpeg",
  outputs: {
    image: ["png", "jpg", "jpeg", "webp", "gif", "avif", "bmp", "tif", "tiff"],
    audio: ["mp3", "wav", "aac", "ogg", "flac", "m4a"],
    video: ["mp4", "webm", "mov", "mkv", "avi"],
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
      quality: true,
      compression: false,
      resolution: true,
      bitrate: true,
      frameRate: true,
      sampleRate: false,
      channels: false,
      metadata: true,
    },
  },
  notes: [
    "The desktop engine is designed for the native FFmpeg path and broader codec support.",
  ],
};

export class TauriEngine implements ConverterEngine {
  readonly capabilities = TAURI_ENGINE_CAPABILITIES;

  async init() {
    if (!isTauriRuntime()) {
      throw new Error(
        "Tauri native conversion is unavailable because the app is not running inside Tauri.",
      );
    }
  }

  async convert(
    request: ConvertRequest,
    onProgress?: (progress: ConvertProgress) => void,
  ): Promise<ConvertResult> {
    if (!isTauriRuntime()) {
      throw new Error(
        "Tauri native conversion is unavailable because the app is not running inside Tauri.",
      );
    }

    onProgress?.({ phase: "preparing", message: "Preparing native conversion..." });

    if (request.nativePath) {
      onProgress?.({ phase: "converting", message: "Converting with native FFmpeg..." });

      const result = await invoke<TauriPathConvertResponse>("convert_file_path", {
        request: {
          inputPath: request.nativePath,
          fileName: request.fileName,
          kind: request.kind,
          outputFormat: request.outputFormat,
          options: request.options ?? {},
        },
      }).catch((error: unknown) => {
        throw new Error(getTauriInvokeErrorMessage(error));
      });

      onProgress?.({ phase: "done", message: "Done." });

      return {
        nativePath: result.nativePath,
        fileName: result.fileName,
        mimeType: result.mimeType,
      };
    }

    if (!request.file) {
      throw new Error("Desktop conversion requires a native file path or a browser File object.");
    }

    if (request.file.size > 250 * 1024 * 1024) {
      throw new Error(
        "This file was added without a native desktop path, so it would need to be copied through JavaScript memory. Use the Select files button in the desktop app for large files.",
      );
    }

    const bytes = Array.from(new Uint8Array(await request.file.arrayBuffer()));

    onProgress?.({ phase: "converting", message: "Converting with native FFmpeg..." });

    const result = await invoke<TauriConvertResponse>("convert_file", {
      request: {
        fileName: request.fileName,
        kind: request.kind,
        outputFormat: request.outputFormat,
        options: request.options ?? {},
        bytes,
      },
    }).catch((error: unknown) => {
      throw new Error(getTauriInvokeErrorMessage(error));
    });

    onProgress?.({ phase: "done", message: "Done." });

    return {
      blob: new Blob([new Uint8Array(result.bytes)], { type: result.mimeType }),
      fileName: result.fileName,
      mimeType: result.mimeType,
    };
  }
}

function getTauriInvokeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return "The native Tauri command failed without returning an error message.";
}
