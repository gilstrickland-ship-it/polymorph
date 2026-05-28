import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateTheme, resolveTheme } from "@polymorph/core";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "..");
const load = (p: string): unknown => JSON.parse(readFileSync(p, "utf8"));

const aurora = load(join(examples, "mock-bank-aurora", "theme", "aurora.tokens.json"));
const borealis = load(join(examples, "mock-bank-borealis", "theme", "borealis.tokens.json"));

// Semantic tokens the onboarding UI depends on (via the adapter's themed components).
const USED_COLORS = [
  "pm.color.surface.base",
  "pm.color.surface.raised",
  "pm.color.text.body",
  "pm.color.text.onAction",
  "pm.color.action.primary.rest",
  "pm.color.border.default",
];
const USED_OTHER = ["pm.radius.control", "pm.radius.card", "pm.typography.heading", "pm.typography.body"];

describe("mock-bank themes conform to the contract (SC-002)", () => {
  it("Aurora validates", () => expect(validateTheme(aurora).valid, JSON.stringify(validateTheme(aurora).errors)).toBe(true));
  it("Borealis validates", () => expect(validateTheme(borealis).valid, JSON.stringify(validateTheme(borealis).errors)).toBe(true));
});

describe("same SDK, two banks — re-skin is a theme/data change only", () => {
  type Tokens = Record<string, { value: unknown } | undefined>;
  const a = resolveTheme(aurora, "light").tokens as Tokens;
  const b = resolveTheme(borealis, "light").tokens as Tokens;

  it("every token the onboarding UI uses resolves in both banks", () => {
    for (const id of [...USED_COLORS, ...USED_OTHER]) {
      expect(a[id], `aurora ${id}`).toBeTruthy();
      expect(b[id], `borealis ${id}`).toBeTruthy();
    }
  });

  it("the two banks render the bank-specific tokens differently (visibly distinct)", () => {
    // Not every token must differ (e.g. onAction text is white in both) — but the defining
    // brand tokens must, which is what makes the re-skin visible.
    const distinct = [
      "pm.color.surface.base",
      "pm.color.text.body",
      "pm.color.action.primary.rest",
      "pm.color.border.default",
    ];
    for (const id of distinct) {
      expect(a[id]!.value, `${id} should differ`).not.toEqual(b[id]!.value);
    }
    expect(a["pm.radius.control"]!.value).not.toEqual(b["pm.radius.control"]!.value);
  });

  it("resolves a dark mode for each bank too", () => {
    const aDark = resolveTheme(aurora, "dark").tokens as Tokens;
    expect(aDark["pm.color.surface.base"]!.value).not.toEqual(a["pm.color.surface.base"]!.value);
  });
});
