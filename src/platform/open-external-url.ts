import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/platform/tauri-runtime";

export async function openExternalUrl(url: string) {
  if (isTauriRuntime()) {
    await invoke("open_external_url", { url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
