import type { ConvertResult, ConverterEngine } from "@/platform/converter/engine";
import type { NativeSelectedFile } from "@/platform/files/types";
import type {
  ConversionCompleteNotification,
  NotificationDeliveryResult,
} from "@/platform/notifications/conversion-notifications";
import type {
  DownloadableOutput,
  SaveOutputResult,
} from "@/platform/output/types";

export interface ConverterPlatformServices {
  engine: ConverterEngine;
  usesNativeFilePicker: boolean;
  cancelAllConversions(): Promise<void>;
  cleanupDownloadableOutput(output: DownloadableOutput): void;
  createDownloadableOutput(result: ConvertResult): DownloadableOutput;
  getExistingNativePaths(paths: string[]): Promise<Set<string>>;
  pickNativeFiles(options: {
    extensions: string[];
    previewLimitBytes: number;
  }): Promise<NativeSelectedFile[]>;
  notifyConversionComplete(
    notification: ConversionCompleteNotification,
  ): Promise<NotificationDeliveryResult>;
  saveDownloadableOutput(output: DownloadableOutput): Promise<SaveOutputResult>;
  saveDownloadableOutputsAsZip(outputs: DownloadableOutput[]): Promise<SaveOutputResult>;
  setSleepPrevention(active: boolean): Promise<void>;
}
