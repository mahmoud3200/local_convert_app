export interface DownloadableOutput {
  fileName: string;
  mimeType: string;
  blob?: Blob;
  objectUrl?: string;
  nativePath?: string;
}

export interface SaveOutputResult {
  status: "saved" | "cancelled";
  target: "browser-download" | "desktop-file";
}
