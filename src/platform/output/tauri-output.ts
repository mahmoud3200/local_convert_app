import type { DownloadableOutput } from "@/features/converter/types";

export async function saveWithNativeDialog(output: DownloadableOutput) {
  const [{ save }, { writeFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const extension = getFileExtension(output.fileName);
  const savePath = await save({
    title: "Save converted file",
    defaultPath: output.fileName,
    filters: extension
      ? [
          {
            name: `${extension.toUpperCase()} file`,
            extensions: [extension],
          },
        ]
      : undefined,
  });

  if (!savePath) {
    return false;
  }

  await writeFile(savePath, new Uint8Array(await output.blob.arrayBuffer()));
  return true;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
