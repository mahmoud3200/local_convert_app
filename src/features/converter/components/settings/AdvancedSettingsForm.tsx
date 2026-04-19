import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdvancedSettings, MediaKind } from "@/features/converter/types";
import type { EngineCapabilities } from "@/platform/converter/engine";

const QUALITY_RANGE = { min: 1, max: 100 };
const COMPRESSION_RANGE = { min: 0, max: 9 };
const DIMENSION_RANGE = { min: 1, max: 16384 };
const FRAME_RATE_RANGE = { min: 1, max: 240 };
const AUDIO_BITRATE_RANGE = { min: 8, max: 512 };
const VIDEO_BITRATE_RANGE = { min: 1, max: 200 };

interface AdvancedSettingsFormProps {
  kind: MediaKind;
  capabilities?: EngineCapabilities;
  settings: AdvancedSettings;
  onChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function AdvancedSettingsForm({
  kind,
  capabilities,
  settings,
  onChange,
}: AdvancedSettingsFormProps) {
  const settingCapabilities = capabilities?.advancedSettings[kind];
  const canShowQuality = settingCapabilities?.quality ?? true;
  const canShowCompression = settingCapabilities?.compression ?? kind === "image";
  const canShowResolution =
    settingCapabilities?.resolution ?? (kind === "image" || kind === "video");
  const canShowBitrate =
    settingCapabilities?.bitrate ?? (kind === "audio" || kind === "video");
  const canShowFrameRate = settingCapabilities?.frameRate ?? kind === "video";
  const canShowSampleRate =
    settingCapabilities?.sampleRate ?? (kind === "audio" || kind === "video");
  const canShowChannels =
    settingCapabilities?.channels ?? (kind === "audio" || kind === "video");
  const canShowMetadata = settingCapabilities?.metadata ?? true;
  const showAudioControls = canShowBitrate || canShowSampleRate || canShowChannels;
  const showImageCompression = kind === "image" && canShowCompression;
  const isCustomResolution = settings.resolution === "custom";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {canShowQuality ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-app-fg">Quality</span>
          <Input
            max={QUALITY_RANGE.max}
            min={QUALITY_RANGE.min}
            type="number"
            value={settings.quality}
            onChange={(event) =>
              onChange(
                "quality",
                clampRequiredNumber(
                  event.target.value,
                  QUALITY_RANGE.min,
                  QUALITY_RANGE.max,
                  settings.quality,
                ),
              )
            }
          />
        </label>
      ) : null}

      {showImageCompression ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-app-fg">Compression</span>
          <Input
            max={COMPRESSION_RANGE.max}
            min={COMPRESSION_RANGE.min}
            type="number"
            value={settings.compression ?? ""}
            onChange={(event) =>
              onChange(
                "compression",
                clampNullableNumber(
                  event.target.value,
                  COMPRESSION_RANGE.min,
                  COMPRESSION_RANGE.max,
                ),
              )
            }
          />
        </label>
      ) : null}

      {canShowResolution ? (
        <>
          <label className="space-y-2">
            <span className="text-sm font-medium text-app-fg">Resolution</span>
            <Select
              value={settings.resolution}
              options={[
                { label: "Original", value: "original" },
                { label: "2x upscale", value: "2x" },
                { label: "1080p", value: "1080p" },
                { label: "720p", value: "720p" },
                { label: "Custom", value: "custom" },
              ]}
              onValueChange={(value) =>
                onChange("resolution", value as AdvancedSettings["resolution"])
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-app-fg">Width</span>
              <Input
                disabled={!isCustomResolution}
                max={DIMENSION_RANGE.max}
                min={DIMENSION_RANGE.min}
                placeholder="Auto"
                type="number"
                value={settings.customWidth}
                onChange={(event) =>
                  onChange(
                    "customWidth",
                    clampOptionalNumber(
                      event.target.value,
                      DIMENSION_RANGE.min,
                      DIMENSION_RANGE.max,
                    ),
                  )
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-app-fg">Height</span>
              <Input
                disabled={!isCustomResolution}
                max={DIMENSION_RANGE.max}
                min={DIMENSION_RANGE.min}
                placeholder="Auto"
                type="number"
                value={settings.customHeight}
                onChange={(event) =>
                  onChange(
                    "customHeight",
                    clampOptionalNumber(
                      event.target.value,
                      DIMENSION_RANGE.min,
                      DIMENSION_RANGE.max,
                    ),
                  )
                }
              />
            </label>
          </div>
        </>
      ) : null}

      {showAudioControls ? (
        <>
          {canShowBitrate ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-app-fg">
                Bitrate ({kind === "audio" ? "kbps" : "Mbps"})
              </span>
              <Input
                max={
                  kind === "audio"
                    ? AUDIO_BITRATE_RANGE.max
                    : VIDEO_BITRATE_RANGE.max
                }
                min={
                  kind === "audio"
                    ? AUDIO_BITRATE_RANGE.min
                    : VIDEO_BITRATE_RANGE.min
                }
                placeholder="Original / auto"
                type="number"
                value={settings.bitrate ?? ""}
                onChange={(event) =>
                  onChange(
                    "bitrate",
                    clampNullableNumber(
                      event.target.value,
                      kind === "audio"
                        ? AUDIO_BITRATE_RANGE.min
                        : VIDEO_BITRATE_RANGE.min,
                      kind === "audio"
                        ? AUDIO_BITRATE_RANGE.max
                        : VIDEO_BITRATE_RANGE.max,
                    ),
                  )
                }
              />
              <span className="block text-xs text-app-muted">
                Leave empty to keep the source behavior when possible.
              </span>
            </label>
          ) : null}

          {canShowSampleRate ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-app-fg">Sample rate</span>
              <Select
                value={String(settings.sampleRate ?? "original")}
                options={[
                  { label: "Original", value: "original" },
                  { label: "32,000 Hz", value: "32000" },
                  { label: "44,100 Hz", value: "44100" },
                  { label: "48,000 Hz", value: "48000" },
                ]}
                onValueChange={(value) =>
                  onChange(
                    "sampleRate",
                    value === "original" ? null : Number(value),
                  )
                }
              />
            </label>
          ) : null}

          {canShowChannels ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-app-fg">Channels</span>
              <Select
                value={String(settings.channels ?? "original")}
                options={[
                  { label: "Original", value: "original" },
                  { label: "Mono", value: "1" },
                  { label: "Stereo", value: "2" },
                ]}
                onValueChange={(value) =>
                  onChange(
                    "channels",
                    value === "original" ? null : (Number(value) as 1 | 2),
                  )
                }
              />
            </label>
          ) : null}
        </>
      ) : null}

      {canShowFrameRate ? (
        <label className="space-y-2">
          <span className="text-sm font-medium text-app-fg">Frame rate</span>
          <Input
            max={FRAME_RATE_RANGE.max}
            min={FRAME_RATE_RANGE.min}
            placeholder="Original"
            type="number"
            value={settings.frameRate ?? ""}
            onChange={(event) =>
              onChange(
                "frameRate",
                clampNullableNumber(
                  event.target.value,
                  FRAME_RATE_RANGE.min,
                  FRAME_RATE_RANGE.max,
                ),
              )
            }
          />
          <span className="block text-xs text-app-muted">
            Leave empty to keep the source frame rate.
          </span>
        </label>
      ) : null}

      {canShowMetadata ? (
        <div className="col-span-full flex items-center justify-between rounded-panel border border-app-border bg-app-subtle px-4 py-3.5">
          <div>
            <span className="block text-sm font-medium text-app-fg">Remove metadata</span>
            <span className="block text-xs text-app-muted">
              Keep exports privacy-first by stripping extra file info.
            </span>
          </div>
          <Switch
            checked={settings.removeMetadata}
            onCheckedChange={(checked) => onChange("removeMetadata", checked)}
          />
        </div>
      ) : null}
    </div>
  );
}

function clampRequiredNumber(
  value: string,
  min: number,
  max: number,
  fallback: number,
) {
  if (value.trim() === "") {
    return fallback;
  }

  return clampNumber(Number(value), min, max);
}

function clampNullableNumber(value: string, min: number, max: number) {
  if (value.trim() === "") {
    return null;
  }

  return clampNumber(Number(value), min, max);
}

function clampOptionalNumber(value: string, min: number, max: number) {
  if (value.trim() === "") {
    return "";
  }

  return clampNumber(Number(value), min, max);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.round(value), min), max);
}
