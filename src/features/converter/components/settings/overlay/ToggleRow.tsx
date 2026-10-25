import { Switch } from "@/components/ui/switch";

interface ToggleRowProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <span className="block text-[15px] leading-[18px] font-medium text-white">
          {label}
        </span>
        <p className="mt-[3px] text-[13px] leading-[15px] text-white/38">
          {description}
        </p>
      </div>

      <Switch
        aria-label={label}
        checked={checked}
        className="h-[26px] w-12 shrink-0 [&>span]:h-5 [&>span]:w-5 [&>span]:translate-x-[2px] [&>span]:bg-white data-[state=checked]:[&>span]:translate-x-[22px] data-[state=checked]:[&>span]:bg-white"
        onCheckedChange={onChange}
      />
    </div>
  );
}
