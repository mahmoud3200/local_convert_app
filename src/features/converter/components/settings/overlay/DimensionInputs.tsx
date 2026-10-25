import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { DIMENSION_RANGE } from "@/features/converter/constants";
import { parseClampedOptionalNumber } from "@/features/converter/settings/settings-numbers";
import { cn } from "@/lib/utils";
import type { AdvancedSettings } from "@/features/converter/types";

interface DimensionInputsProps {
  baseDimensions: { height: number | null; width: number | null };
  customHeight: number | "";
  customWidth: number | "";
  isCustom: boolean;
  naturalHeight: number | null;
  naturalWidth: number | null;
  onChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function DimensionInputs({
  baseDimensions,
  customHeight,
  customWidth,
  isCustom,
  naturalHeight,
  naturalWidth,
  onChange,
}: DimensionInputsProps) {
  const [isLocked, setIsLocked] = useState(true);

  function handleDimensionChange(
    key: "customWidth" | "customHeight",
    rawValue: string,
  ) {
    const nextValue = parseClampedOptionalNumber(rawValue, DIMENSION_RANGE);
    onChange(key, nextValue);

    if (!isLocked || typeof nextValue !== "number") {
      return;
    }

    const ratio =
      naturalWidth && naturalHeight
        ? naturalWidth / naturalHeight
        : typeof customWidth === "number" && typeof customHeight === "number"
          ? customWidth / customHeight
          : null;

    if (!ratio) {
      return;
    }

    if (key === "customWidth") {
      onChange(
        "customHeight",
        parseClampedOptionalNumber(
          String(Math.round(nextValue / ratio)),
          DIMENSION_RANGE,
        ),
      );
    } else {
      onChange(
        "customWidth",
        parseClampedOptionalNumber(
          String(Math.round(nextValue * ratio)),
          DIMENSION_RANGE,
        ),
      );
    }
  }

  return (
    <div className="mt-4 flex items-end gap-3">
      <DimensionInput
        disabled={!isCustom}
        label="Width (px)"
        value={isCustom ? customWidth : (baseDimensions.width ?? "")}
        onChange={(value) => handleDimensionChange("customWidth", value)}
      />

      <button
        aria-label={isLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
        aria-pressed={isLocked}
        className={cn(
          "mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-4 focus-visible:ring-app-accent/20 focus-visible:outline-none",
          isLocked && "border-app-accent/31 bg-app-accent/[0.08] text-app-accent",
        )}
        type="button"
        onClick={() => setIsLocked((current) => !current)}
      >
        {isLocked ? (
          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <LockOpen aria-hidden="true" className="h-3.5 w-3.5" />
        )}
      </button>

      <DimensionInput
        disabled={!isCustom}
        label="Height (px)"
        value={isCustom ? customHeight : (baseDimensions.height ?? "")}
        onChange={(value) => handleDimensionChange("customHeight", value)}
      />
    </div>
  );
}

interface DimensionInputProps {
  disabled: boolean;
  label: string;
  value: number | "";
  onChange: (value: string) => void;
}

function DimensionInput({
  disabled,
  label,
  value,
  onChange,
}: DimensionInputProps) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-[6px] block text-[11px] leading-[15px] text-white/38">
        {label}
      </span>
      <input
        aria-label={`Custom output ${label.replace(" (px)", "").toLowerCase()}`}
        className={inputClassName}
        disabled={disabled}
        max={DIMENSION_RANGE.max}
        min={DIMENSION_RANGE.min}
        placeholder="Auto"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const inputClassName =
  "h-10 w-full rounded-[8px] border border-white/10 bg-white/[0.04] px-3 text-center text-[13px] font-semibold text-white outline-none transition placeholder:font-normal placeholder:text-white/25 focus:border-app-accent/50 focus-visible:ring-4 focus-visible:ring-app-accent/10 disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.02] disabled:text-white/45 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
