import type { LintWarning } from "@polymorph/core";

interface LintPanelProps {
  warnings: LintWarning[];
  /** When set, the panel includes a "highlight" affordance via `data-pm-highlighted-token`. */
  highlightedTokenId?: string;
  /** Called when the user activates a warning row — typical wiring scrolls the editor to it. */
  onActivate?(warning: LintWarning): void;
}

/**
 * Render a list of advisory lint warnings with accessible semantics (`role="list"`,
 * `aria-live="polite"` so screen readers announce new warnings as edits land).
 *
 * Each row carries `data-pm-lint-code` so callers can target individual codes with their own
 * CSS (e.g. amber for contrast-low, red for missing-required-text — though *every* warning
 * here is advisory; the styling choice is the FI's).
 */
export function LintPanel({ warnings, highlightedTokenId, onActivate }: LintPanelProps): JSX.Element {
  return (
    <ul role="list" aria-live="polite" aria-label="Theme lint warnings" data-pm-panel="lint">
      {warnings.length === 0 && (
        <li data-pm-lint-empty="true">No advisory warnings.</li>
      )}
      {warnings.map((w, i) => (
        <li
          key={`${w.code}-${i}`}
          data-pm-lint-code={w.code}
          data-pm-highlighted-token={
            highlightedTokenId && w.tokenIds.includes(highlightedTokenId) ? "true" : undefined
          }
        >
          <button
            type="button"
            onClick={() => onActivate?.(w)}
            disabled={!onActivate}
          >
            <span data-pm-lint-message="true">{w.message}</span>
            <span data-pm-lint-tokens="true">{w.tokenIds.join(", ")}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
