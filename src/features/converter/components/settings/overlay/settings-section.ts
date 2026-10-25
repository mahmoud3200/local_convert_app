import type { ReactNode } from "react";

export interface SettingsSectionEntry {
  id: string;
  content: ReactNode;
}

export const SETTINGS_SECTION_ORDER = [
  "quality",
  "compression",
  "bitrate",
  "frame-rate",
  "resolution",
  "sample-rate",
  "channels",
] as const;
