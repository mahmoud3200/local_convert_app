import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/platform/tauri-runtime";
import type { NativeSelectedFile } from "./types";

type NativeFileMetadata = {
  path: string;
  fileName: string;
  size: number;
};

export async function pickNativeFiles(
  extensions: string[],
  previewLimitBytes: number,
): Promise<NativeSelectedFile[]> {
  if (!isTauriRuntime()) {
    return [];
  }

  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    title: "Select files",
    multiple: true,
    fileAccessMode: "scoped",
    filters: [
      {
        name: "Supported media",
        extensions,
      },
    ],
  });

  if (!selected) {
    return [];
  }

  const paths = Array.isArray(selected) ? selected : [selected];
  if (paths.length === 0) {
    return [];
  }

  const metadata = await invoke<NativeFileMetadata[]>("get_native_file_metadata", {
    paths,
  });

  return metadata.map((file) => ({
    path: file.path,
    name: file.fileName,
    size: file.size,
    previewUrl:
      file.size <= previewLimitBytes ? convertFileSrc(file.path) : null,
  }));
}
