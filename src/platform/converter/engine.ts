export type MediaKind = "image" | "audio" | "video";
export type EngineRuntime = "web-wasm" | "tauri-native";

export type AdvancedSettingCapabilities = {
  quality: boolean;
  compression: boolean;
  resolution: boolean;
  bitrate: boolean;
  frameRate: boolean;
  sampleRate: boolean;
  channels: boolean;
  metadata: boolean;
};

export type EngineCapabilities = {
  runtime: EngineRuntime;
  label: string;
  outputs: Record<MediaKind, string[]>;
  advancedSettings: Record<MediaKind, AdvancedSettingCapabilities>;
  notes: string[];
};

export type ConvertRequest = {
  jobId: string;
  file?: File;
  nativePath?: string;
  fileName: string;
  fileSize: number;
  kind: MediaKind;
  outputFormat: string;
  options?: {
    quality?: number;
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: string;
    sampleRate?: number;
    channels?: number;
    removeMetadata?: boolean;
  };
};

export type ConvertProgress = {
  phase: "idle" | "loading" | "preparing" | "converting" | "done" | "error";
  ratio?: number;
  message?: string;
};

export type ConvertResult = {
  blob?: Blob;
  nativePath?: string;
  fileName: string;
  mimeType: string;
};

export interface ConverterEngine {
  readonly capabilities: EngineCapabilities;
  init(): Promise<void>;
  cancel(jobId: string): Promise<void>;
  convert(
    request: ConvertRequest,
    onProgress?: (progress: ConvertProgress) => void,
  ): Promise<ConvertResult>;
}
