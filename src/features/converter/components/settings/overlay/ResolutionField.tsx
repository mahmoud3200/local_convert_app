import {
  RESOLUTION_LABELS,
  RESOLUTION_OPTIONS,
} from "@/features/converter/constants";
import { getOutputDimensions } from "@/features/converter/settings/output-dimensions";
import { DimensionInputs } from "./DimensionInputs";
import { OptionCardGroup } from "./OptionCardGroup";
import type {
  AdvancedSettings,
  MediaKind,
  ResolutionMode,
} from "@/features/converter/types";

interface ResolutionFieldProps {
  customHeight: number | "";
  customWidth: number | "";
  kind: MediaKind;
  naturalHeight: number | null;
  naturalWidth: number | null;
  resolution: ResolutionMode;
  onChange: <Key extends keyof AdvancedSettings>(
    key: Key,
    value: AdvancedSettings[Key],
  ) => void;
}

export function ResolutionField({
  customHeight,
  customWidth,
  kind,
  naturalHeight,
  naturalWidth,
  resolution,
  onChange,
}: ResolutionFieldProps) {
  const options = RESOLUTION_OPTIONS[kind];
  const baseDimensions = getOutputDimensions(
    resolution,
    customWidth,
    customHeight,
    naturalWidth,
    naturalHeight,
  );

  return (
    <div>
      <OptionCardGroup
        label="Resolution"
        options={options.map((option) => ({
          value: option,
          label: RESOLUTION_LABELS[option],
          hint: getOptionHint(option, naturalWidth, naturalHeight),
        }))}
        value={resolution}
        onChange={(value) => onChange("resolution", value)}
      />

      <DimensionInputs
        baseDimensions={baseDimensions}
        customHeight={customHeight}
        customWidth={customWidth}
        isCustom={resolution === "custom"}
        naturalHeight={naturalHeight}
        naturalWidth={naturalWidth}
        onChange={onChange}
      />
    </div>
  );
}

function getOptionHint(
  resolution: ResolutionMode,
  naturalWidth: number | null,
  naturalHeight: number | null,
) {
  const dimensions = getOutputDimensions(
    resolution,
    "",
    "",
    naturalWidth,
    naturalHeight,
  );

  if (!dimensions.width || !dimensions.height) {
    return undefined;
  }

  return `${dimensions.width} × ${dimensions.height}`;
}
