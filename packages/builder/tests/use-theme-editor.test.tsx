import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderHook, act } from "@testing-library/react";
import { useThemeEditor, readAuthoredValue } from "../src/use-theme-editor.js";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"), "utf8"),
);

describe("useThemeEditor", () => {
  it("starts clean: dirty=false, valid theme, changed=empty", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    expect(result.current.state.dirty).toBe(false);
    expect(result.current.state.validation.valid).toBe(true);
    expect(result.current.state.changedTokenIds.size).toBe(0);
  });

  it("setTokenValue marks the theme dirty + lists the changed token id", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#ff00ff"));
    expect(result.current.state.dirty).toBe(true);
    expect(result.current.state.changedTokenIds.has("pm.color.surface.base")).toBe(true);
  });

  it("writes mode-sensitive ids under pm.modes.<mode>", () => {
    const { result } = renderHook(() => useThemeEditor(aurora, "dark"));
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#abcdef"));
    const written = readAuthoredValue(result.current.state.working, "pm.color.surface.base", "dark");
    expect(written).toBe("#abcdef");
    // The light-mode value is untouched.
    expect(readAuthoredValue(result.current.state.working, "pm.color.surface.base", "light")).toBe(
      readAuthoredValue(aurora, "pm.color.surface.base", "light"),
    );
  });

  it("writes mode-invariant ids under pm.* (not pm.modes)", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() => result.current.setTokenValue("pm.space.md", "dimension", { value: 999, unit: "px" }));
    const working = result.current.state.working as Record<string, unknown>;
    const pm = working.pm as Record<string, unknown>;
    const space = pm.space as Record<string, { $value: unknown }>;
    expect(space.md!.$value).toEqual({ value: 999, unit: "px" });
  });

  it("reset() reverts every edit", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#ff00ff"));
    act(() => result.current.reset());
    expect(result.current.state.dirty).toBe(false);
    expect(result.current.state.changedTokenIds.size).toBe(0);
  });

  it("commit() snapshots the working theme as the new baseline", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#ff00ff"));
    act(() => result.current.commit());
    expect(result.current.state.dirty).toBe(false);
    // A further edit at a DIFFERENT token shows up alone.
    act(() => result.current.setTokenValue("pm.color.text.body", "color", "#101010"));
    expect(Array.from(result.current.state.changedTokenIds)).toEqual(["pm.color.text.body"]);
  });

  it("recomputes lint warnings on every edit (touch-target shrinks → TOUCH_TARGET_SMALL fires)", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    expect(result.current.state.warnings.find((w) => w.code === "TOUCH_TARGET_SMALL")).toBeUndefined();
    act(() => result.current.setTokenValue("pm.size.touchTarget.min", "dimension", { value: 20, unit: "px" }));
    expect(result.current.state.warnings.find((w) => w.code === "TOUCH_TARGET_SMALL")).toBeDefined();
  });

  it("schema-invalid edits surface in state.validation", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    // `$value` for a dimension must be `{ value: number, unit: string }` — passing a number
    // structurally violates the schema and `validation.valid` flips false.
    act(() => result.current.setTokenValue("pm.space.md", "dimension", 999));
    expect(result.current.state.validation.valid).toBe(false);
  });

  it("loadTheme() replaces both baseline + working in one step", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#ff00ff"));
    act(() => result.current.loadTheme(aurora));
    expect(result.current.state.dirty).toBe(false);
    expect(result.current.state.changedTokenIds.size).toBe(0);
  });

  it("exportTheme() returns a clone, not a live reference", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    const exported = result.current.exportTheme() as Record<string, unknown>;
    act(() => result.current.setTokenValue("pm.color.surface.base", "color", "#ff00ff"));
    // The exported snapshot from BEFORE the edit must not see the new value.
    expect(JSON.stringify(exported)).not.toContain('"#ff00ff"');
  });
});

describe("setComponentProperty — writes under pm.<role>.<property> + flows through resolveTheme", () => {
  it("authors the override at the path the resolver reads from", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() =>
      result.current.setComponentProperty("button.primary", "background", {
        $type: "color",
        $value: "#abcdef",
      }),
    );
    // The override lives under `pm.button.primary.background` (NOT `pm.components.button.primary.background`).
    const working = result.current.state.working as any;
    expect(working.pm.button.primary.background.$value).toBe("#abcdef");
  });

  it("dirties the editor and surfaces under changedComponentPaths (not changedTokenIds)", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() =>
      result.current.setComponentProperty("button.primary", "background", {
        $type: "color",
        $value: "#abcdef",
      }),
    );
    const { state } = result.current;
    expect(state.dirty).toBe(true);
    expect(state.changedComponentPaths.has("button.primary.background")).toBe(true);
    expect(state.changedTokenIds.size).toBe(0);
  });

  it("supports single-segment role names (e.g. `card`, `disclosure`)", () => {
    const { result } = renderHook(() => useThemeEditor(aurora));
    act(() =>
      result.current.setComponentProperty("card", "background", {
        $type: "color",
        $value: "#102030",
      }),
    );
    const working = result.current.state.working as any;
    expect(working.pm.card.background.$value).toBe("#102030");
    expect(result.current.state.changedComponentPaths.has("card.background")).toBe(true);
  });
});
