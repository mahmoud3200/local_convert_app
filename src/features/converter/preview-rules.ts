import { MAX_PREVIEW_FILE_SIZE_BYTES } from "./constants";
import type { ManagedConversionFile } from "./types";

// checks if the file is more than the setted value
export function canPreviewFile(file: ManagedConversionFile) {
  if (file.size > MAX_PREVIEW_FILE_SIZE_BYTES) {
    return false;
  }

  if (file.kind === "image") {
    return Boolean(file.previewUrl);
  }

  return Boolean(file.previewUrl || file.file);
}
