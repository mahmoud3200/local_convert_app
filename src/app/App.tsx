import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConverterScreen } from "@/features/converter/components/layout/ConverterScreen";
import { createConverterPlatform } from "@/platform/create-converter-platform";
import { WebsiteAnalytics } from "./WebsiteAnalytics";

const converterPlatform = createConverterPlatform(); // either wasm converter for the browser or native ffmpeg converter for the native desktop app (taurti v2)

function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <main className="bg-app-main flex min-h-screen items-center justify-center px-4 py-6 text-app-fg md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <ConverterScreen platform={converterPlatform} />
        </div>
      </main>
      <WebsiteAnalytics />
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
