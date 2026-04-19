import { useEffect, useMemo, useState } from "react";
import {
  loadStoredThemePreference,
  saveStoredThemePreference,
} from "@/features/converter/theme-storage";
import type { ResolvedTheme, ThemePreference } from "@/features/converter/types";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useThemePreference() {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    loadStoredThemePreference(),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );

  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (themePreference === "system" ? systemTheme : themePreference),
    [systemTheme, themePreference],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    saveStoredThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return {
    resolvedTheme,
    setThemePreference,
    themePreference,
  };
}
