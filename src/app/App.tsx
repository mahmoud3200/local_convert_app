import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConverterScreen } from "@/features/converter/components/layout/ConverterScreen";
import { supportsBrowserConversionRuntime } from "@/platform/check-browser-support";
import { createConverterPlatform } from "@/platform/create-converter-platform";
import { WebsiteAnalytics } from "./WebsiteAnalytics";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { DESKTOP_DOWNLOAD_LINK } from "@/features/converter/constants";

const converterPlatform = createConverterPlatform(); // either wasm converter for the browser or native ffmpeg converter for the native desktop app (taurti v2)

function App() {
  const isUnsupportedWebBrowser =
    !converterPlatform.usesNativeFilePicker &&
    !supportsBrowserConversionRuntime;

  if (isUnsupportedWebBrowser) {
    return (
      <main className="bg-app-main flex min-h-dvh items-center justify-center px-6 py-12 text-app-fg">
        <div className="surface-panel max-w-xl px-8 py-10 text-center">
          <h1 className="font-display text-2xl font-bold">
            Browser not supported
          </h1>
          <p className="mt-3 text-sm text-app-muted">
            Browser conversion is not supported in this browser. Use a modern
            browser or download the desktop app at{" "}
            <a
              className="text-app-accent underline underline-offset-4"
              href={DESKTOP_DOWNLOAD_LINK}
            >
              {DESKTOP_DOWNLOAD_LINK}
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <main className="bg-app-main relative min-h-dvh overflow-hidden text-app-fg">
        <div className="mx-auto flex min-h-dvh w-full max-w-421 flex-col px-5 pb-20 pt-6 sm:px-8 lg:pt-11.5">
          <ConverterScreen platform={converterPlatform} />
        </div>
      </main>
      <WebsiteAnalytics />
      <CookieConsentBanner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4500,
          style: {
            background: "var(--background-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-control)",
            boxShadow: "var(--shadow-m)",
            color: "var(--foreground)",
          },
          error: {
            duration: 8000,
          },
        }}
      />
    </TooltipProvider>
  );
}

export default App;
