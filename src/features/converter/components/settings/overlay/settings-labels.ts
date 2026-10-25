import {
  FRAME_RATE_OPTIONS,
  SAMPLE_RATE_OPTIONS,
} from "@/features/converter/constants";

export function buildFrameRateOptions(frameRate: number | null) {
  const options = [
    { value: 0, label: "Original" },
    ...FRAME_RATE_OPTIONS.map((value) => ({
      value,
      label: `${value} fps`,
    })),
  ];

  if (
    frameRate !== null &&
    !(FRAME_RATE_OPTIONS as ReadonlyArray<number>).includes(frameRate)
  ) {
    options.push({ value: frameRate, label: `${frameRate} fps` });
  }

  return options;
}

export function formatSampleRate(sampleRate: number | null) {
  if (!sampleRate) {
    return "Source rate";
  }

  const option = SAMPLE_RATE_OPTIONS.find(
    (sampleRateOption) => sampleRateOption.value === sampleRate,
  );

  return option?.label ?? `${sampleRate} Hz`;
}

export function formatChannels(channels: 1 | 2 | null) {
  if (channels === 1) {
    return "Mono";
  }

  if (channels === 2) {
    return "Stereo";
  }

  return "Source channels";
}
