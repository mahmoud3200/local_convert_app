interface SettingsSectionNavProps<TSection extends string> {
  activeSection: TSection;
  activeTextClassName?: string;
  sections: ReadonlyArray<{ id: TSection; label: string }>;
  onSectionChange: (section: TSection) => void;
}

export function SettingsSectionNav<TSection extends string>({
  activeSection,
  activeTextClassName = "text-app-fg",
  sections,
  onSectionChange,
}: SettingsSectionNavProps<TSection>) {
  return (
    <aside className="space-y-2">
      {sections.map((section) => (
        <button
          key={section.id}
          className={`w-full rounded-control border px-4 py-3 text-left text-sm font-medium transition ${
            activeSection === section.id
              ? `border-app-accent bg-app-accent-soft ${activeTextClassName}`
              : "border-app-border bg-app-subtle text-app-fg hover:bg-app-control"
          }`}
          type="button"
          onClick={() => onSectionChange(section.id)}
        >
          {section.label}
        </button>
      ))}
    </aside>
  );
}
