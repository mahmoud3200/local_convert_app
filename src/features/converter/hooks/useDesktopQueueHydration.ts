import { useEffect, useRef, useState } from "react";
import { loadStoredDesktopQueue } from "@/features/converter/files/desktop-queue-storage";
import type {
  FileConversionSettings,
  ManagedConversionFile,
} from "@/features/converter/types";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

interface UseDesktopQueueHydrationOptions {
  platform: ConverterPlatformServices;
  restoreFiles: (files: ManagedConversionFile[]) => void;
  restoreSettings: (settings: Record<string, FileConversionSettings>) => void;
}

export function useDesktopQueueHydration({
  platform,
  restoreFiles,
  restoreSettings,
}: UseDesktopQueueHydrationOptions) {
  const [isHydrated, setIsHydrated] = useState(!platform.usesNativeFilePicker);
  const restoreRef = useRef({ restoreFiles, restoreSettings });

  useEffect(() => {
    restoreRef.current = { restoreFiles, restoreSettings };
  }, [restoreFiles, restoreSettings]);

  useEffect(() => {
    if (!platform.usesNativeFilePicker || isHydrated) {
      return;
    }

    let cancelled = false;

    async function hydrateDesktopQueue() {
      const restoredQueue = loadStoredDesktopQueue(
        platform.engine.capabilities,
      );
      const existingPaths = await platform.getExistingNativePaths(
        restoredQueue.files
          .map((file) => file.nativePath)
          .filter((path): path is string => Boolean(path)),
      );

      if (cancelled) {
        return;
      }

      const files = restoredQueue.files.filter(
        (file) => file.nativePath && existingPaths.has(file.nativePath),
      );
      const fileIds = new Set(files.map((file) => file.id));
      const settingsByFileId = Object.fromEntries(
        Object.entries(restoredQueue.settingsByFileId).filter(([fileId]) =>
          fileIds.has(fileId),
        ),
      );

      restoreRef.current.restoreFiles(files);
      restoreRef.current.restoreSettings(settingsByFileId);
      setIsHydrated(true);
    }

    void hydrateDesktopQueue().catch((error: unknown) => {
      console.warn("Could not restore the desktop queue:", error);

      if (!cancelled) {
        setIsHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, platform]);

  return isHydrated;
}
