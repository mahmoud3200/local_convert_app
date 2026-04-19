import { lazy, Suspense } from "react";
import { isTauriRuntime } from "@/platform/tauri-runtime";

const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((module) => ({
    default: module.Analytics,
  })),
);

export function WebsiteAnalytics() {
  if (isTauriRuntime()) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  );
}
