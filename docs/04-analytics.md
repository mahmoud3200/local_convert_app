# Analytics

LoConvert has one optional analytics integration: Google Analytics 4 on the web build. The desktop app has no analytics.

This document is the source of truth for analytics behavior, consent, configuration, and testing.

## Principles

- Conversion stays local.
- Analytics are optional and opt-in.
- No analytics script loads before consent.
- The desktop app never loads analytics and never shows a consent banner.
- Rejecting consent must be as easy as accepting.
- File contents, file names, and conversion settings are never sent to analytics.

## What runs where

| Runtime | Analytics | Consent banner |
| --- | --- | --- |
| Web | Google Analytics 4, only after **Accept all** | Web only, when analytics is configured |
| Desktop | None | Never shown |

Google Analytics may collect standard usage data such as page path, referrer, browser, device category, and approximate location. LoConvert does not send media files, file names, or conversion settings to Google Analytics.

## Consent behavior

The web cookie banner is intentionally simple:

- **Reject** stores the decision and keeps Google Analytics off.
- **Accept all** stores the decision and loads Google Analytics.
- There are no granular categories.
- The banner only appears when analytics is configured.
- The decision is stored in `localStorage` under `local-convert:cookie-consent:v1`.
- Returning visitors who accepted consent load analytics on the next visit.
- Returning visitors who rejected consent keep analytics off.
- There is currently no in-app control to change a stored decision; clearing site data resets it.

No Google Analytics script is injected before a visitor accepts.

## Google Analytics setup

Set a GA4 measurement ID for the web build:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Local development:

```bash
cp .env.example .env
```

Then add the measurement ID to `.env` and restart the dev server.

Vercel deployment:

1. Open the project environment variables.
2. Add `VITE_GA_MEASUREMENT_ID`.
3. Redeploy so Vite can inline the value at build time.

The value must start with `G-` followed by letters or numbers. If the variable is missing or invalid:

- Google Analytics is not loaded
- the consent banner is not shown
- conversion is unaffected

Disabling analytics is the same as leaving the variable empty.

## Desktop exclusion

The desktop app uses the same frontend, so the analytics code must be explicitly disabled inside Tauri.

Guards:

- `shouldShowCookieConsentBanner()` returns `false` in Tauri.
- `loadGoogleAnalytics()` returns early in Tauri.
- `WebsiteAnalytics` does nothing in Tauri.

`isTauriRuntime()` from `src/platform/tauri-runtime.ts` is the single runtime check used by all three guards.

Do not rely on network blocking or CSP to keep the desktop app offline. The code should never attempt the request.

## Implementation

| File | Responsibility |
| --- | --- |
| `src/app/analytics/google-analytics.ts` | Reads the measurement ID, validates it, injects the gtag script, and sends the initial page view |
| `src/app/analytics/cookie-consent.ts` | Reads and writes the consent decision and decides whether the banner is needed |
| `src/app/CookieConsentBanner.tsx` | Renders the Reject / Accept all banner |
| `src/app/WebsiteAnalytics.tsx` | Restores analytics for returning visitors who already accepted |
| `src/platform/tauri-runtime.ts` | Detects the Tauri runtime |

The Google Analytics loader:

1. Checks that a valid measurement ID exists.
2. Checks that the app is not running in Tauri.
3. Initializes `window.dataLayer` and `window.gtag`.
4. Queues the `js` and `config` commands.
5. Appends the `gtag.js` script.

The script is only inserted once.

## Troubleshooting

**The cookie banner is not showing**

`VITE_GA_MEASUREMENT_ID` is probably missing or invalid, or this browser already has a stored consent decision. Clear site data to test the first-visit flow.

**Analytics is not loading after accepting**

Check the browser network panel for `googletagmanager.com`. Content blockers, privacy extensions, or a restrictive CSP can prevent the script from loading.

**The banner appears on desktop**

That is a bug. Check that every analytics path uses `isTauriRuntime()` and that the app is actually running inside Tauri rather than a normal browser preview.

## Testing checklist

Use a fresh browser profile or clear site data before testing consent.

1. With `VITE_GA_MEASUREMENT_ID` unset, confirm there is no banner and no `googletagmanager.com` request.
2. With a valid ID, confirm the banner appears on the web.
3. Before choosing, confirm no analytics script loads.
4. Choose **Reject**, reload, and confirm the banner stays hidden and analytics stays off.
5. Clear site data, choose **Accept all**, and confirm `gtag.js` loads and the initial page view is sent.
6. Reload and confirm the banner stays hidden and analytics loads automatically.
7. Run the desktop app and confirm there is no banner and no analytics request.

## Related docs

- [How LoConvert works](01-how-loconvert-works.md)
- [Web application](02-web-application.md)
- [Desktop application](03-desktop-application.md)
- [Contributing](../CONTRIBUTING.md)
