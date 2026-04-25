export interface NativeSelectedFile {
  path: string;
  name: string;
  size: number;
  type?: string;
  metadataUrl?: string | null;
  previewUrl: string | null;
}
