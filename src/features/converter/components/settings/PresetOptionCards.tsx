import type {
  PresetSelection,
  QualityPreset,
  SelectOptionValue,
} from "@/features/converter/types";

interface PresetOptionCardsProps {
  customMessage: string;
  options: Array<SelectOptionValue<QualityPreset>>;
  selectedPreset: PresetSelection;
  onSelect: (preset: QualityPreset) => void;
}

export function PresetOptionCards({
  customMessage,
  options,
  selectedPreset,
  onSelect,
}: PresetOptionCardsProps) {
  return (
    <>
      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            className={`block w-full rounded-control border px-4 py-3 text-left transition ${
              selectedPreset === option.value
                ? "border-app-accent bg-app-accent-soft"
                : "border-app-border bg-app-control hover:bg-app-subtle"
            }`}
            type="button"
            onClick={() => onSelect(option.value)}
          >
            <span className="block text-sm font-semibold text-app-fg">
              {option.label}
            </span>
            {option.description ? (
              <span className="mt-1 block text-xs text-app-muted">
                {option.description}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {selectedPreset === null ? (
        <p className="text-xs text-app-muted">{customMessage}</p>
      ) : null}
    </>
  );
}
