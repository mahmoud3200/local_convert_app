import { isTauriRuntime } from "@/platform/tauri-runtime";

const GOOGLE_ANALYTICS_SCRIPT_ID = "loconvert-google-analytics";
const GOOGLE_ANALYTICS_MEASUREMENT_ID = (
  import.meta.env.VITE_GA_MEASUREMENT_ID ?? ""
).trim();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const isGoogleAnalyticsConfigured = /^G-[A-Z0-9]+$/i.test(
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
);

let isGoogleAnalyticsLoaded = false;

export function loadGoogleAnalytics() {
  if (
    !isGoogleAnalyticsConfigured ||
    isGoogleAnalyticsLoaded ||
    isTauriRuntime() ||
    typeof document === "undefined"
  ) {
    return;
  }

  isGoogleAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer ?? [];

  // gtag.js only processes dataLayer entries that are `arguments` objects, which is
  // what the official snippet pushes. Pushing a plain array makes gtag.js queue the
  // command but never send the hit, so no page_view ever reaches Google Analytics.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    anonymize_ip: true,
  });

  if (document.getElementById(GOOGLE_ANALYTICS_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.id = GOOGLE_ANALYTICS_SCRIPT_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    GOOGLE_ANALYTICS_MEASUREMENT_ID,
  )}`;
  document.head.appendChild(script);
}
