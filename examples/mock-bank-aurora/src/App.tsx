import { ThemeProvider } from "@polymorph/adapter-react-native";
import { Onboarding } from "@polymorph/example-reference-sdk-onboarding";
import { resolveTheme } from "@polymorph/core";
import auroraTheme from "../theme/aurora.tokens.json";

/**
 * Aurora's host shell. It hosts the unmodified reference onboarding SDK and supplies its own
 * design system via a resolved theme — the only Aurora-specific thing here is the theme import.
 */
export function App(): JSX.Element {
  return (
    <ThemeProvider theme={resolveTheme(auroraTheme, "light")}>
      <Onboarding />
    </ThemeProvider>
  );
}
