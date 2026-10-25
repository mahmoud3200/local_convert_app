import type { ResolutionMode } from "../types";

interface OutputDimensions {
  height: number | null;
  width: number | null;
}

export function getOutputDimensions(
  resolution: ResolutionMode,
  customWidth: number | "",
  customHeight: number | "",
  naturalWidth: number | null,
  naturalHeight: number | null,
): OutputDimensions {
  if (resolution === "custom") {
    return {
      width: typeof customWidth === "number" ? customWidth : null,
      height: typeof customHeight === "number" ? customHeight : null,
    };
  }

  if (!naturalWidth || !naturalHeight) {
    if (resolution === "1080p") {
      return { width: 1920, height: 1080 };
    }

    if (resolution === "720p") {
      return { width: 1280, height: 720 };
    }

    return { width: null, height: null };
  }

  if (resolution === "2x") {
    return { width: naturalWidth * 2, height: naturalHeight * 2 };
  }

  if (resolution === "1080p" || resolution === "720p") {
    const height = resolution === "1080p" ? 1080 : 720;

    return {
      width: Math.round((naturalWidth / naturalHeight) * height),
      height,
    };
  }

  return { width: naturalWidth, height: naturalHeight };
}
