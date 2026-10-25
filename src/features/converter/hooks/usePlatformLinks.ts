import { useToast } from "@/hooks/useToast";
import {
  DESKTOP_DOWNLOAD_LINK,
  PROJECT_GITHUB_URL,
} from "@/features/converter/constants";
import type { ConverterPlatformServices } from "@/platform/converter-platform";

export function usePlatformLinks(platform: ConverterPlatformServices) {
  const toast = useToast();

  async function openExternalUrl(url: string, fallbackMessage: string) {
    try {
      await platform.openExternalUrl(url);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : fallbackMessage);
    }
  }

  return {
    openInstallApp: () =>
      openExternalUrl(
        DESKTOP_DOWNLOAD_LINK,
        "Could not open the desktop download page.",
      ),
    openRepository: () =>
      openExternalUrl(PROJECT_GITHUB_URL, "Could not open the project repository."),
  };
}
