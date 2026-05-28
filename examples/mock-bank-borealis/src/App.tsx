import { ThemeProvider } from "@polymorph/adapter-react-native";
import { Onboarding } from "@polymorph/example-reference-sdk-onboarding";
import { resolveTheme } from "@polymorph/core";
import borealisTheme from "../theme/borealis.tokens.json";

/**
 * Borealis's host shell. Same unmodified reference onboarding SDK as Aurora — only the theme
 * import differs, proving the SDK re-skins with zero source changes.
 */
export function App(): JSX.Element {
  return (
    <ThemeProvider theme={resolveTheme(borealisTheme, "light")}>
      <Onboarding />
    </ThemeProvider>
  );
}
