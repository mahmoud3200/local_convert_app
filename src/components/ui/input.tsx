import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-control border border-app-border bg-app-control px-3 text-sm text-app-fg outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-4 focus:ring-app-accent/10 disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export { Input };
