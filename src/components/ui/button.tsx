import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-app-accent text-app-accent-fg font-bold shadow-[0_10px_30px_-14px_rgba(124,211,249,0.6)] hover:bg-app-accent-hover",
  secondary:
    "border border-app-border bg-app-control font-semibold text-app-fg hover:border-app-border-strong hover:bg-white/12",
  ghost:
    "bg-transparent font-medium text-app-muted hover:bg-app-subtle hover:text-app-fg",
  danger:
    "border border-app-error-border bg-app-control font-semibold text-app-error hover:bg-app-error-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4 py-2 text-sm",
  sm: "h-9 px-3.5 py-2 text-[13px]",
  icon: "h-9 w-9 p-0",
};

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "default", variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control transition outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 disabled:cursor-not-allowed disabled:opacity-45",
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
