import { Select } from "@/components/ui/select";
import type { OutputFormat, SelectOptionValue } from "@/features/converter/types";

interface FormatSelectProps {
  options: SelectOptionValue<OutputFormat>[];
  value: OutputFormat;
  onChange: (value: OutputFormat) => void;
}

export function FormatSelect({ options, value, onChange }: FormatSelectProps) {
  return (
    <Select
      ariaLabel="Output format"
      className="h-10 w-full max-w-[220px] min-w-[132px] rounded-[10px] border-white/19 bg-white/[0.08] px-3 text-[13px] font-semibold text-white hover:border-white/30 hover:bg-white/[0.12] focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
      iconClassName="h-3.5 w-3.5 text-white/50"
      options={options}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as OutputFormat)}
    />
  );
}
