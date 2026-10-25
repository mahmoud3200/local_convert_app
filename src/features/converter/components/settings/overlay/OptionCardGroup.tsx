import { cn } from "@/lib/utils";

interface OptionCardGroupOption<TValue extends string | number> {
  hint?: string;
  label: string;
  value: TValue;
}

interface OptionCardGroupProps<TValue extends string | number> {
  description?: string;
  label: string;
  options: ReadonlyArray<OptionCardGroupOption<TValue>>;
  value: TValue | null;
  onChange: (value: TValue) => void;
}

export function OptionCardGroup<TValue extends string | number>({
  description,
  label,
  options,
  value,
  onChange,
}: OptionCardGroupProps<TValue>) {
  return (
    <div>
      <span className="block text-[15px] leading-[18px] font-medium text-white">
        {label}
      </span>
      {description ? (
        <p className="mt-[3px] text-[13px] leading-[15px] text-white/38">
          {description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "inline-flex h-[37px] items-center gap-3 rounded-[9px] border px-4 text-[13px] leading-[17px] transition outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20",
                isSelected
                  ? "border-app-accent/31 bg-app-accent/[0.08] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
              )}
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  isSelected ? "border-app-accent" : "border-white/25",
                )}
              >
                {isSelected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-app-accent" />
                ) : null}
              </span>
              <span className="whitespace-nowrap">{option.label}</span>
              {option.hint ? (
                <span className="whitespace-nowrap text-[11px] leading-[15px] text-white/38">
                  {option.hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
