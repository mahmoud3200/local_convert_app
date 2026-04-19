import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConverterScreen } from "@/features/converter/components/layout/ConverterScreen";
import Layout from "@/components/layout/Layout";
import { WebsiteAnalytics } from "./WebsiteAnalytics";

function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <Layout>
        <ConverterScreen />
      </Layout>
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
