import { isTauriRuntime } from "@/platform/tauri-runtime";

type WakeLockSentinelLike = EventTarget & {
  release(): Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinelLike>;
  };
};

let wakeLock: WakeLockSentinelLike | null = null;
let shouldPreventSleep = false;

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && shouldPreventSleep) {
      void acquireWebWakeLock();
    }
  });
}

export async function setSleepPrevention(active: boolean) {
  if (isTauriRuntime()) {
    return;
  }

  shouldPreventSleep = active;

  if (active) {
    await acquireWebWakeLock();
    return;
  }

  await releaseWebWakeLock();
}

async function acquireWebWakeLock() {
  if (wakeLock || typeof navigator === "undefined") {
    return;
  }

  const wakeLockApi = (navigator as NavigatorWithWakeLock).wakeLock;
  if (!wakeLockApi) {
    return;
  }

  wakeLock = await wakeLockApi.request("screen");
  wakeLock.addEventListener("release", () => {
    wakeLock = null;
  });
}

async function releaseWebWakeLock() {
  const currentWakeLock = wakeLock;
  wakeLock = null;

  if (currentWakeLock) {
    await currentWakeLock.release();
  }
}
