import { useId } from "react";
import type { FieldProps } from "./types.js";

/**
 * Edit a `cubicBezier` token (`[x1, y1, x2, y2]`). Four number inputs in a row. The contract
 * constrains x1 / x2 to [0, 1]; the field exposes those bounds via `min` / `max` but doesn't
 * enforce them on input (lint catches invalid bezier curves).
 */
export function CubicBezierField({
  value,
  onChange,
  label,
  id,
  disabled,
}: FieldProps<readonly [number, number, number, number]>): JSX.Element {
  const autoId = useId();
  const groupId = id ?? `pm-bezier-${autoId}`;
  const labels = ["x1", "y1", "x2", "y2"];
  return (
    <div data-pm-field="cubicBezier" role="group" aria-labelledby={`${groupId}-label`}>
      {label && <span id={`${groupId}-label`}>{label}</span>}
      {value.map((n, i) => (
        <input
          key={i}
          type="number"
          value={n}
          disabled={disabled}
          step="0.01"
          min={i % 2 === 0 ? 0 : undefined}
          max={i % 2 === 0 ? 1 : undefined}
          aria-label={`${label ?? "bezier"} ${labels[i]}`}
          onChange={(e) => {
            const next = [...value] as [number, number, number, number];
            next[i] = Number(e.target.value);
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}
