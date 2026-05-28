import { useId } from "react";
import type { FieldProps } from "./types.js";

/**
 * Edit a `number` token (currently used for opacity / scalar values 0..1). Optional `min` /
 * `max` / `step` overrides for token families that have a natural range (opacity ∈ [0, 1]).
 */
export function NumberField({
  value,
  onChange,
  label,
  id,
  disabled,
  min,
  max,
  step = "any",
}: FieldProps<number> & { min?: number; max?: number; step?: number | "any" }): JSX.Element {
  const autoId = useId();
  const inputId = id ?? `pm-number-${autoId}`;
  return (
    <div data-pm-field="number">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type="number"
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
