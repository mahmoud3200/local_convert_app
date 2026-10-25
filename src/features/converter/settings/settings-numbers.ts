import type { SettingsRange } from "../constants";

export function clampNumber(value: number, range: SettingsRange) {
  if (!Number.isFinite(value)) {
    return range.min;
  }

  return Math.min(Math.max(Math.round(value), range.min), range.max);
}

export function parseClampedOptionalNumber(
  value: string,
  range: SettingsRange,
) {
  if (value.trim() === "") {
    return "";
  }

  return clampNumber(Number(value), range);
}
