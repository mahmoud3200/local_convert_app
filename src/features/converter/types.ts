export type MediaKind = "image" | "audio" | "video";
type SupportedInputKind = MediaKind | "unknown";
export type ManagedFileStatus = "ready" | "converting" | "done" | "error";

export type OutputFormat =
  | "original"
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "avif"
  | "gif"
  | "bmp"
  | "tif"
  | "tiff"
  | "mp3"
  | "wav"
  | "aac"
  | "ogg"
  | "flac"
  | "m4a"
  | "mp4"
  | "webm"
  | "mov"
  | "mkv"
  | "avi";

export type ResolutionMode = "original" | "2x" | "1080p" | "720p" | "custom";

export interface AdvancedSettings {
  quality: number;
  compression: number | null;
  resolution: ResolutionMode;
  customWidth: number | "";
  customHeight: number | "";
  bitrate: number | null;
  frameRate: number | null;
  sampleRate: number | null;
  channels: 1 | 2 | null;
  removeMetadata: boolean;
}

export interface FileConversionSettings {
  format: OutputFormat;
  advanced: AdvancedSettings;
}

export interface SelectOptionValue<TValue extends string = string> {
  label: string;
  value: TValue;
  description?: string;
}

export interface SupportedInputDefinition {
  extensions: string[];
  mimePrefixes: string[];
  label: string;
}

export interface DetectedFileInfo {
  kind: SupportedInputKind;
  extension: string;
}

export interface ManagedConversionFile {
  id: string;
  file?: File;
  nativePath?: string;
  name: string;
  size: number;
  sizeLabel: string;
  type: string;
  kind: MediaKind;
  extension: string;
  previewUrl: string | null;
  shouldRevokePreviewUrl: boolean;
  naturalWidth: number | null;
  naturalHeight: number | null;
  status: ManagedFileStatus;
}
