import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-app-accent text-app-accent-fg shadow-[0_10px_30px_-18px_rgba(37,99,235,0.85)] hover:opacity-90",
  secondary:
    "border border-app-border bg-app-control text-app-fg hover:bg-app-subtle hover:text-app-fg",
  ghost: "bg-transparent text-app-muted hover:bg-app-subtle hover:text-app-fg",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-12 px-4 py-2 text-sm",
  sm: "h-10 px-3 py-2 text-sm",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "default", variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition outline-none focus-visible:ring-4 focus-visible:ring-app-accent/15 disabled:cursor-not-allowed disabled:opacity-45",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button };
