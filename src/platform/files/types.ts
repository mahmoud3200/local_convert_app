export interface NativeSelectedFile {
  path: string;
  name: string;
  size: number;
  type?: string;
  previewUrl: string | null;
}
