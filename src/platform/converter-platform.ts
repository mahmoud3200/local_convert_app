import type { ConvertResult, ConverterEngine } from "@/platform/converter/engine";
import type { NativeSelectedFile } from "@/platform/files/types";
import type {
  DownloadableOutput,
  SaveOutputResult,
} from "@/platform/output/types";

export interface ConverterPlatformServices {
  engine: ConverterEngine;
  usesNativeFilePicker: boolean;
  cleanupDownloadableOutput(output: DownloadableOutput): void;
  createDownloadableOutput(result: ConvertResult): DownloadableOutput;
  pickNativeFiles(options: {
    extensions: string[];
    previewLimitBytes: number;
  }): Promise<NativeSelectedFile[]>;
  saveDownloadableOutput(output: DownloadableOutput): Promise<SaveOutputResult>;
  saveDownloadableOutputsAsZip(outputs: DownloadableOutput[]): Promise<SaveOutputResult>;
}
