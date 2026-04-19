import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SelectProps {
  className?: string;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function Select({
  className,
  options,
  placeholder,
  value,
  onValueChange,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-control border border-app-border bg-app-control px-3 text-sm text-app-fg outline-none transition focus:border-app-accent focus:ring-4 focus:ring-app-accent/10 data-[placeholder]:text-app-muted disabled:cursor-not-allowed disabled:opacity-45",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-app-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-control border border-app-border bg-app-control p-1.5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.38)]"
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="space-y-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-control px-3 py-2.5 pr-9 text-sm text-app-fg outline-none transition focus:bg-app-subtle focus:text-app-fg data-[state=checked]:bg-app-accent-soft data-[state=checked]:text-app-fg"
                value={option.value}
              >
                <div className="flex min-w-0 flex-col">
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  {option.description ? (
                    <span className="mt-0.5 text-xs text-app-muted">{option.description}</span>
                  ) : null}
                </div>
                <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
