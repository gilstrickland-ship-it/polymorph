import { useId } from "react";
import type { FieldProps } from "./types.js";

export interface DurationValue {
  value: number;
  unit: "ms" | "s";
}

/**
 * Edit a `duration` token. The contract's two accepted units are `ms` + `s`; we offer both
 * and the consumer (codegen / `applyReducedMotion`) handles unit conversion.
 */
export function DurationField({
  value,
  onChange,
  label,
  id,
  disabled,
}: FieldProps<DurationValue>): JSX.Element {
  const autoId = useId();
  const inputId = id ?? `pm-duration-${autoId}`;
  return (
    <div data-pm-field="duration">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type="number"
        value={value.value}
        disabled={disabled}
        step="any"
        min={0}
        aria-label={label ? `${label} (value)` : "duration value"}
        onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
      />
      <select
        value={value.unit}
        disabled={disabled}
        aria-label={label ? `${label} (unit)` : "duration unit"}
        onChange={(e) => onChange({ ...value, unit: e.target.value as DurationValue["unit"] })}
      >
        <option value="ms">ms</option>
        <option value="s">s</option>
      </select>
    </div>
  );
}
