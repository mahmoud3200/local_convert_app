import { useId, useState } from "react";
import { clampNumber } from "@/features/converter/settings/settings-numbers";
import type { SettingsRange } from "@/features/converter/constants";
import type React from "react";

interface SliderFieldProps {
  description: string;
  endLabel: string;
  label: string;
  range: SettingsRange;
  startLabel: string;
  value: number;
  onChange: (value: number) => void;
}

export function SliderField({
  description,
  endLabel,
  label,
  range,
  startLabel,
  value,
  onChange,
}: SliderFieldProps) {
  const inputId = useId();
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const displayValue = editingValue ?? String(value);

  const progress = ((value - range.min) / (range.max - range.min)) * 100;
  const trackStyle = {
    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%, rgba(255, 255, 255, 0.1) 100%)`,
  } as React.CSSProperties;

  function handleNumberChange(rawValue: string) {
    setEditingValue(rawValue);

    if (rawValue.trim() === "") {
      return;
    }

    const numericValue = Number(rawValue);

    if (Number.isFinite(numericValue)) {
      onChange(clampNumber(numericValue, range));
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <label
            className="block text-[15px] leading-[18px] font-medium text-white"
            htmlFor={inputId}
          >
            {label}
          </label>
          <p className="mt-[3px] text-[13px] leading-[15px] text-white/38">
            {description}
          </p>
        </div>

        <input
          aria-label={`${label} value`}
          className="h-8 w-[52px] shrink-0 rounded-[8px] border border-white/10 bg-white/[0.06] text-center text-[13px] leading-[18px] font-semibold text-white outline-none tabular-nums transition focus:border-app-accent/50 focus-visible:ring-4 focus-visible:ring-app-accent/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          id={inputId}
          max={range.max}
          min={range.min}
          step={range.step}
          type="number"
          value={displayValue}
          onBlur={() => setEditingValue(null)}
          onChange={(event) => handleNumberChange(event.target.value)}
        />
      </div>

      <div className="mt-3">
        <div className="relative flex h-[18px] items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={trackStyle}
          />
          <input
            aria-label={label}
            className="settings-slider relative z-10"
            max={range.max}
            min={range.min}
            step={range.step}
            type="range"
            value={value}
            onChange={(event) =>
              onChange(clampNumber(Number(event.target.value), range))
            }
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] leading-[14px] text-white/31">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>
    </div>
  );
}
