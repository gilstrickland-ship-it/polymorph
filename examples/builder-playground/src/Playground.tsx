import { ThemeProvider } from "@polymorph/adapter-web";
import { ThemeEditorRoot } from "@polymorph/builder";
import { resolveTheme } from "@polymorph/core";
import auroraTheme from "../../mock-bank-aurora/theme/aurora.tokens.json" with { type: "json" };
import { Showcase } from "./Showcase.js";

/**
 * The Builder Playground: a complete demonstration that `@polymorph/builder` composes with
 * the Web adapter for a live, end-to-end visual theme editor. The FI's design-system team
 * runs this, customises any of the tokens exposed in the editor list, and the showcase
 * re-renders against the working theme.
 *
 * What it proves:
 *  - useThemeEditor's `state.working` flows into adapter-web's ThemeProvider unchanged.
 *  - Live edits trigger a re-render of every themed primitive — no extra wiring.
 *  - `renderPreview({ theme, mode })` is the only contract surface; the rest is React.
 *
 * Token list is intentionally small — the editor exposes the high-leverage tokens (brand
 * colour, surface base, body text). A real internal tool would scroll the full required
 * set; this example trims it for visual clarity.
 */
const EXPOSED_TOKEN_IDS = [
  "pm.color.surface.base",
  "pm.color.text.body",
  "pm.color.action.primary.rest",
  "pm.color.action.primary.hover",
  "pm.color.border.focus",
  "pm.space.md",
  "pm.radius.control",
] as const;

export function Playground(): JSX.Element {
  return (
    <ThemeEditorRoot
      initialTheme={auroraTheme}
      tokenIds={[...EXPOSED_TOKEN_IDS]}
      onCommit={(theme) => {
        // In a real internal tool this PUTs to the FI's theme service. The playground
        // simply logs to demonstrate the contract.
        // eslint-disable-next-line no-console
        console.log("[playground] committed theme", theme);
      }}
      renderPreview={({ theme, mode }) => (
        // `resolveTheme(theme, mode)` flows the working theme + current editor mode into
        // the adapter-web ThemeProvider unchanged. Every themed primitive in `Showcase`
        // reads its values from this resolved snapshot, so a token edit propagates with
        // no extra wiring.
        <ThemeProvider theme={resolveTheme(theme, mode)}>
          <div data-pm-example="playground-preview">
            <Showcase />
          </div>
        </ThemeProvider>
      )}
    />
  );
}
