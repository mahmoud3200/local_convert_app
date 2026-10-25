import { cn } from "@/lib/utils";
import type { ManagedFileStatus } from "@/features/converter/types";

export function FileStatusLabel({ status }: { status: ManagedFileStatus }) {
  if (status === "ready") {
    return null;
  }

  const label =
    status === "done" ? "Done" : status === "error" ? "Failed" : "Converting";
  const tone =
    status === "done"
      ? "text-app-success"
      : status === "error"
        ? "text-app-error"
        : "text-app-accent";

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium", tone)}>
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "done"
            ? "bg-app-success"
            : status === "error"
              ? "bg-app-error"
              : "animate-pulse bg-app-accent",
        )}
      />
      {label}
    </span>
  );
}
