import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { resolveTheme } from "@polymorph/core";
import { toTokenMap } from "@polymorph/adapter-web";
import type { ThemeMode, SemanticTokenId } from "@polymorph/spec";
import { SATORI_FONTS } from "./font.js";
import type { WebGoldenScenario } from "./scenarios.js";

/** Render a scenario + theme + mode to a deterministic PNG (Satori → resvg, no browser). */
export async function renderScenarioToPng(
  scenario: WebGoldenScenario,
  theme: unknown,
  mode: ThemeMode = "light",
): Promise<Buffer> {
  const resolved = resolveTheme(theme, mode);
  const tokens = toTokenMap(resolved) as Readonly<Record<SemanticTokenId, unknown>>;
  const tree = scenario.build(tokens);
  // Satori's TS types are JSX-flavoured; our tree shape (`{type, props}`) is the same runtime
  // representation React.createElement produces, so we cast at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(tree as any, { width: scenario.width, height: scenario.height, fonts: SATORI_FONTS });
  return Buffer.from(new Resvg(svg).render().asPng());
}
