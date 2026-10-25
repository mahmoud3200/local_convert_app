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
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
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
