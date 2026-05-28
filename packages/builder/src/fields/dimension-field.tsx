import { useId } from "react";
import type { FieldProps } from "./types.js";

export interface DimensionValue {
  value: number;
  unit: "px" | "rem" | "em" | "%";
}

const UNITS: DimensionValue["unit"][] = ["px", "rem", "em", "%"];

/**
 * Edit a `dimension` token (`{ value, unit }`). Number input + unit dropdown — the contract
 * doesn't carry arbitrary units, so a closed dropdown beats a free-text suffix.
 */
export function DimensionField({
  value,
  onChange,
  label,
  id,
  disabled,
}: FieldProps<DimensionValue>): JSX.Element {
  const autoId = useId();
  const inputId = id ?? `pm-dimension-${autoId}`;
  return (
    <div data-pm-field="dimension">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type="number"
        value={value.value}
        disabled={disabled}
        step="any"
        aria-label={label ? `${label} (value)` : "dimension value"}
        onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
      />
      <select
        value={value.unit}
        disabled={disabled}
        aria-label={label ? `${label} (unit)` : "dimension unit"}
        onChange={(e) => onChange({ ...value, unit: e.target.value as DimensionValue["unit"] })}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}
