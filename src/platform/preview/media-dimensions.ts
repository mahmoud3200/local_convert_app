type MediaDimensions = {
  width: number | null;
  height: number | null;
  detailsLabel: string;
};

export async function loadMediaDimensions(
  kind: "image" | "video",
  mediaUrl: string,
): Promise<MediaDimensions> {
  if (kind === "image") {
    return await new Promise<MediaDimensions>((resolve) => {
      const image = new Image();
      image.onload = () =>
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
          detailsLabel: `${image.naturalWidth} x ${image.naturalHeight}`,
        });
      image.onerror = () =>
        resolve({ width: null, height: null, detailsLabel: "Image" });
      image.src = mediaUrl;
    });
  }

  return await new Promise<MediaDimensions>((resolve) => {
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
    };
    video.onerror = () =>
      resolve({ width: null, height: null, detailsLabel: "Video" });
    video.src = mediaUrl;
  });
}
