import { useMemo } from "react";
import { TOKENS, type SemanticTokenId, type ThemeMode } from "@polymorph/spec";
import { resolveTheme } from "@polymorph/core";
import { TokenField } from "./fields/token-field.js";
import { LintPanel } from "./lint-panel.js";
import { useThemeEditor, type ThemeEditorHook } from "./use-theme-editor.js";

interface ThemeEditorRootProps {
  initialTheme: unknown;
  initialMode?: ThemeMode;
  /** Restrict which token ids the editor exposes. Default: every required token. */
  tokenIds?: SemanticTokenId[];
  /** Called when the user clicks the (caller-rendered) "Save" CTA; the editor doesn't ship one. */
  onCommit?(theme: unknown): void;
  /**
   * Render the preview surface. Receives the live `working` theme + `mode`; the caller
   * decides what to show (a settings card, a button strip, a real app preview via
   * `ThemeProvider` from `@polymorph/adapter-web`). When omitted, no preview is rendered.
   */
  renderPreview?(args: { theme: unknown; mode: ThemeMode }): React.ReactNode;
}

/**
 * Unstyled orchestrator combining the headless hook + token fields + lint panel. The host
 * styles every `data-pm-*` attribute via their own CSS — the builder ships zero opinions on
 * layout.
 *
 * For sophisticated UIs (drag-drop reordering, multi-section grouping, search), use the
 * hook directly and skip this orchestrator. It exists for the 80% case where a tabular
 * "id / label / value" layout is enough.
 */
export function ThemeEditorRoot({
  initialTheme,
  initialMode = "light",
  tokenIds,
  onCommit,
  renderPreview,
}: ThemeEditorRootProps): JSX.Element {
  const editor: ThemeEditorHook = useThemeEditor(initialTheme, initialMode);
  const { state, setTokenValue, setMode, reset } = editor;

  const exposed = useMemo(
    () => (tokenIds ?? TOKENS.filter((t) => t.required).map((t) => t.id)),
    [tokenIds],
  );

  // Resolve once for the current mode so each row can show the resolved value next to its
  // authored value (handy when an alias is in play).
  const resolved = state.validation.valid ? resolveTheme(state.working, state.mode) : null;

  return (
    <div data-pm-builder="root">
      <div data-pm-builder="toolbar">
        <label>
          Mode
          <select value={state.mode} onChange={(e) => setMode(e.target.value as ThemeMode)}>
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="highContrast">highContrast</option>
          </select>
        </label>
        <span data-pm-builder="dirty">{state.dirty ? "● unsaved" : "✓ saved"}</span>
        <button type="button" onClick={reset} disabled={!state.dirty}>
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            editor.commit();
            onCommit?.(editor.exportTheme());
          }}
          disabled={!state.dirty || !state.validation.valid}
        >
          Save
        </button>
      </div>

      <div data-pm-builder="layout">
        <ul data-pm-builder="token-list" role="list">
          {exposed.map((id) => {
            const tok = TOKENS.find((t) => t.id === id);
            if (!tok) return null;
            const node = resolved?.tokens[id];
            const value = node?.value;
            const changed = state.changedTokenIds.has(id);
            return (
              <li key={id} data-pm-token-id={id} data-pm-token-changed={changed ? "true" : undefined}>
                <code>{id}</code>
                <TokenField
                  $type={tok.type}
                  value={value}
                  onChange={(next) => setTokenValue(id, tok.type, next)}
                />
              </li>
            );
          })}
        </ul>

        {renderPreview && (
          <div data-pm-builder="preview">{renderPreview({ theme: state.working, mode: state.mode })}</div>
        )}
      </div>

      <LintPanel warnings={state.warnings} />
    </div>
  );
}
