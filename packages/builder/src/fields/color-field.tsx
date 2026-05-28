import { useId } from "react";
import type { FieldProps } from "./types.js";

/**
 * Edit a `#rrggbb` color token. Pairs a native `<input type="color">` (for picker UX) with
 * an `<input type="text">` (for direct hex entry) so power users can type, and casual users
 * can drag. The text input drives the source of truth; the color input mirrors it.
 *
 * Accepts and emits hex strings only — the contract's color type is hex per the schema.
 * Callers who need alpha use the text input ("#rrggbbaa"); the color input drops alpha
 * silently per the HTML spec.
 */
export function ColorField({ value, onChange, label, id, disabled }: FieldProps<string>): JSX.Element {
  const autoId = useId();
  const inputId = id ?? `pm-color-${autoId}`;
  const isValid = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
  // The color picker only accepts #rrggbb (no alpha). Drop alpha for its display value.
  const pickerValue = isValid ? value.slice(0, 7) : "#000000";
  return (
    <div data-pm-field="color">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        type="color"
        value={pickerValue}
        disabled={disabled}
        aria-label={label ? `${label} (picker)` : "color picker"}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        id={inputId}
        type="text"
        value={value}
        disabled={disabled}
        aria-invalid={!isValid}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
