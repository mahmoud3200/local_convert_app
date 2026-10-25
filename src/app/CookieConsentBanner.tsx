import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loadGoogleAnalytics } from "./analytics/google-analytics";
import {
  saveCookieConsent,
  shouldShowCookieConsentBanner,
  type CookieConsent,
} from "./analytics/cookie-consent";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(shouldShowCookieConsentBanner);

  if (!isVisible) {
    return null;
  }

  function choose(consent: CookieConsent) {
    saveCookieConsent(consent);

    if (consent === "accepted") {
      loadGoogleAnalytics();
    }

    setIsVisible(false);
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-app-border bg-app-elevated/95 px-5 py-4 shadow-l backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm leading-6 text-app-muted-strong">
          <span className="font-semibold text-app-fg">
            Cookies &amp; analytics.
          </span>{" "}
          We use Google Analytics cookies to understand how the web app is used.
          You can reject them without affecting conversions.
        </p>

        <div className="flex shrink-0 gap-2">
          <Button
            className="flex-1 sm:flex-none"
            size="sm"
            variant="secondary"
            onClick={() => choose("rejected")}
          >
            Reject
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            size="sm"
            onClick={() => choose("accepted")}
          >
            Accept all
          </Button>
        </div>
      </div>
    </section>
  );
}
