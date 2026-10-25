import { useEffect } from "react";
import { isTauriRuntime } from "@/platform/tauri-runtime";
import { readCookieConsent } from "./analytics/cookie-consent";
import { loadGoogleAnalytics } from "./analytics/google-analytics";

export function WebsiteAnalytics() {
  const isDesktop = isTauriRuntime();

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    if (readCookieConsent() === "accepted") {
      loadGoogleAnalytics();
    }
  }, [isDesktop]);

  return null;
}
