export async function loadMediaDimensions(
  file: File,
  kind: "image" | "video",
  previewUrl?: string | null,
) {
  if (kind === "image" && previewUrl) {
    return await new Promise<{ width: number | null; height: number | null; detailsLabel: string }>(
      (resolve) => {
        const image = new Image();
        image.onload = () =>
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
            detailsLabel: `${image.naturalWidth} x ${image.naturalHeight}`,
          });
        image.onerror = () =>
          resolve({ width: null, height: null, detailsLabel: "Image" });
        image.src = previewUrl;
      },
    );
  }

  if (kind === "video") {
    return await new Promise<{ width: number | null; height: number | null; detailsLabel: string }>(
      (resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth || null,
            height: video.videoHeight || null,
            detailsLabel:
              video.videoWidth && video.videoHeight
                ? `${video.videoWidth} x ${video.videoHeight}`
                : "Video",
          });
          URL.revokeObjectURL(objectUrl);
        };
        video.onerror = () => {
          resolve({ width: null, height: null, detailsLabel: "Video" });
          URL.revokeObjectURL(objectUrl);
        };
        video.src = objectUrl;
      },
    );
  }

  return {
    width: null,
    height: null,
    detailsLabel: "Image",
  };
}
