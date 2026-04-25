import { isTauriRuntime } from "@/platform/tauri-runtime";

export interface ConversionCompleteNotification {
  inputFileName: string;
  outputFileName: string;
}

export type NotificationDeliveryResult =
  | { status: "sent" }
  | { reason: "not-tauri" | "permission-denied"; status: "skipped" }
  | { error: string; status: "failed" };

export async function notifyConversionComplete({
  inputFileName,
  outputFileName,
}: ConversionCompleteNotification): Promise<NotificationDeliveryResult> {
  if (!isTauriRuntime()) {
    return { reason: "not-tauri", status: "skipped" };
  }

  try {
    const { isPermissionGranted, requestPermission, sendNotification } =
      await import("@tauri-apps/plugin-notification");

    let hasPermission = await isPermissionGranted();

    if (!hasPermission) {
      hasPermission = (await requestPermission()) === "granted";
    }

    if (!hasPermission) {
      return { reason: "permission-denied", status: "skipped" };
    }

    sendNotification({
      body: `${inputFileName} has been converted to ${outputFileName}`,
      title: "Conversion complete",
    });

    return { status: "sent" };
  } catch (error) {
    return { error: getNotificationErrorDetail(error), status: "failed" };
  }
}

function getNotificationErrorDetail(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "The desktop notification plugin returned an unknown error.";
}
