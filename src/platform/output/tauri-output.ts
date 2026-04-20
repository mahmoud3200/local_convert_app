import type { DownloadableOutput } from "./types";

export async function saveWithNativeDialog(output: DownloadableOutput) {
  const [{ save }, { invoke }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/api/core"),
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

  if (output.nativePath) {
    await invoke("copy_generated_output", {
      request: {
        sourcePath: output.nativePath,
        targetPath: savePath,
      },
    });
    return true;
  }

  if (!output.blob) {
    throw new Error("Converted output is missing.");
  }

  const { writeFile } = await import("@tauri-apps/plugin-fs");
  await writeFile(savePath, new Uint8Array(await output.blob.arrayBuffer()));
  return true;
}

export async function saveNativeOutputsAsZipWithDialog(
  outputs: DownloadableOutput[],
) {
  const nativeOutputs = outputs.map((output) => {
    if (!output.nativePath) {
      throw new Error(`Converted output is missing a native path: ${output.fileName}`);
    }

    return {
      sourcePath: output.nativePath,
      fileName: output.fileName,
    };
  });
  const [{ save }, { invoke }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/api/core"),
  ]);
  const savePath = await save({
    title: "Save converted files",
    defaultPath: "local-convert-results.zip",
    filters: [
      {
        name: "ZIP archive",
        extensions: ["zip"],
      },
    ],
  });

  if (!savePath) {
    return false;
  }

  await invoke("zip_generated_outputs", {
    request: {
      targetPath: savePath,
      outputs: nativeOutputs,
    },
  });

  return true;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
