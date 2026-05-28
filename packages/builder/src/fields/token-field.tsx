import type { JSX } from "react";
import { ColorField } from "./color-field.js";
import { DimensionField, type DimensionValue } from "./dimension-field.js";
import { DurationField, type DurationValue } from "./duration-field.js";
import { NumberField } from "./number-field.js";
import { CubicBezierField } from "./cubic-bezier-field.js";

interface TokenFieldProps {
  $type: string;
  value: unknown;
  onChange(next: unknown): void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Dispatch to the right typed field component based on the token's `$type`. Returns `null`
 * for types the builder doesn't yet edit visually (typography / shadow): those are richer
 * composites and the visual editor for them ships separately. Callers can target them with
 * their own custom field renderer until then.
 */
export function TokenField({ $type, value, onChange, label, id, disabled }: TokenFieldProps): JSX.Element | null {
  switch ($type) {
    case "color":
      return (
        <ColorField
          value={typeof value === "string" ? value : "#000000"}
          onChange={onChange as (s: string) => void}
          label={label}
          id={id}
          disabled={disabled}
        />
      );
    case "dimension":
      return (
        <DimensionField
          value={value as DimensionValue}
          onChange={onChange as (v: DimensionValue) => void}
          label={label}
          id={id}
          disabled={disabled}
        />
      );
    case "duration":
      return (
        <DurationField
          value={value as DurationValue}
          onChange={onChange as (v: DurationValue) => void}
          label={label}
          id={id}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <NumberField
          value={typeof value === "number" ? value : 0}
          onChange={onChange as (n: number) => void}
          label={label}
          id={id}
          disabled={disabled}
        />
      );
    case "cubicBezier":
      return (
        <CubicBezierField
          value={value as readonly [number, number, number, number]}
          onChange={onChange as (v: readonly [number, number, number, number]) => void}
          label={label}
          id={id}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}
