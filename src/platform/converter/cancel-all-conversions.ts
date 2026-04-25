import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/platform/tauri-runtime";

export async function cancelAllConversions() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("cancel_all_conversions");
}
