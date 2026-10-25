import { isTauriRuntime } from "@/platform/tauri-runtime";
import { isGoogleAnalyticsConfigured } from "./google-analytics";

export const COOKIE_CONSENT_STORAGE_KEY = "local-convert:cookie-consent:v1";

export type CookieConsent = "accepted" | "rejected";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsent) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  } catch {
    // The banner can still be dismissed for this session if storage is blocked.
  }
}

export function shouldShowCookieConsentBanner() {
  return (
    !isTauriRuntime() &&
    isGoogleAnalyticsConfigured &&
    readCookieConsent() === null
  );
}
