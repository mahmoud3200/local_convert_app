import type { ResolvedTheme, ThemePreference } from "@/features/converter/types";

interface AppearanceSettingsPanelProps {
  resolvedTheme: ResolvedTheme;
  themePreference: ThemePreference;
  onThemePreferenceChange: (preference: ThemePreference) => void;
}

export function AppearanceSettingsPanel({
  resolvedTheme,
  themePreference,
  onThemePreferenceChange,
}: AppearanceSettingsPanelProps) {
  const options: Array<{
    value: ThemePreference;
    label: string;
    description: string;
  }> = [
    {
      value: "system",
      label: "System",
      description: `Follow the operating system preference. Currently resolved as ${resolvedTheme}.`,
    },
    {
      value: "light",
      label: "Light",
      description: "Use the high-contrast light theme.",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Use the high-contrast dark theme.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-app-fg">Appearance</h3>
        <p className="mt-1 text-sm text-app-muted">
          Theme changes apply immediately and are saved automatically.
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            className={`block w-full rounded-control border px-4 py-3 text-left transition ${
              themePreference === option.value
                ? "border-app-accent bg-app-accent-soft"
                : "border-app-border bg-app-control hover:bg-app-subtle"
            }`}
            type="button"
            onClick={() => onThemePreferenceChange(option.value)}
          >
            <span className="block text-sm font-semibold text-app-fg">
              {option.label}
            </span>
            <span className="mt-1 block text-xs text-app-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
