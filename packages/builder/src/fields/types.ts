/**
 * Shared contract every typed field implements. Caller passes the current value + a change
 * handler; the field renders the appropriate native control + emits the typed value back.
 * No styling is imposed — every field carries a stable `data-pm-field` attribute that the
 * caller can target with their own CSS.
 */
export interface FieldProps<T> {
  value: T;
  onChange(next: T): void;
  /** Visible label. Field hooks it up to the underlying control via `aria-label` / `htmlFor`. */
  label?: string;
  /** Stable id forwarded to the underlying control. Defaults to a generated id. */
  id?: string;
  disabled?: boolean;
}
