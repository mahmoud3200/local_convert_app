import type { ConverterEngine } from "./engine";
import { isTauriRuntime } from "@/platform/tauri-runtime";
import { TauriEngine } from "./tauri-engine";
import { WasmEngine } from "./wasm-engine";

let webEngine: ConverterEngine | null = null;
let tauriEngine: ConverterEngine | null = null;

export function createConverterEngine(): ConverterEngine {
  if (isTauriRuntime()) {
    tauriEngine ??= new TauriEngine();
    return tauriEngine;
  }

  webEngine ??= new WasmEngine();
  return webEngine;
}
