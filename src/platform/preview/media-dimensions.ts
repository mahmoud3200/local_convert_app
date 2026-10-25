type MediaDimensions = {
  width: number | null;
  height: number | null;
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
        });
      image.onerror = () => resolve({ width: null, height: null });
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
      });
    };
    video.onerror = () => resolve({ width: null, height: null });
    video.src = mediaUrl;
  });
}
