import { isTauri } from "@tauri-apps/api/core";

export function isTauriRuntime() {
  return (
    isTauri() ||
    (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window)
  );
}
