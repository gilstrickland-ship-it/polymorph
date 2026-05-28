import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeEditorRoot } from "../src/theme-editor-root.js";

const here = dirname(fileURLToPath(import.meta.url));
const aurora = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "examples", "mock-bank-aurora", "theme", "aurora.tokens.json"), "utf8"),
);

describe("ThemeEditorRoot", () => {
  it("renders the mode dropdown + dirty indicator + reset / save buttons", () => {
    render(<ThemeEditorRoot initialTheme={aurora} tokenIds={["pm.color.surface.base"]} />);
    expect(screen.getByLabelText("Mode")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("✓ saved")).toBeTruthy();
  });

  it("Save button is disabled when no edits have been made", () => {
    render(<ThemeEditorRoot initialTheme={aurora} tokenIds={["pm.color.surface.base"]} />);
    const save = screen.getByText("Save").closest("button") as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it("emits the new theme via onCommit when Save is pressed after an edit", () => {
    const onCommit = vi.fn();
    const { container } = render(
      <ThemeEditorRoot initialTheme={aurora} tokenIds={["pm.color.surface.base"]} onCommit={onCommit} />,
    );
    const row = container.querySelector("[data-pm-token-id='pm.color.surface.base']") as HTMLElement;
    const text = row.querySelector("input[type='text']") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "#abcdef" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(onCommit.mock.calls[0]![0])).toContain('"#abcdef"');
  });

  it("renders the preview slot when provided", () => {
    render(
      <ThemeEditorRoot
        initialTheme={aurora}
        tokenIds={["pm.color.surface.base"]}
        renderPreview={({ mode }) => <div data-testid="preview">mode={mode}</div>}
      />,
    );
    expect(screen.getByTestId("preview").textContent).toBe("mode=light");
  });

  it("preview re-renders when the mode dropdown changes", () => {
    render(
      <ThemeEditorRoot
        initialTheme={aurora}
        tokenIds={["pm.color.surface.base"]}
        renderPreview={({ mode }) => <div data-testid="preview">mode={mode}</div>}
      />,
    );
    fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "dark" } });
    expect(screen.getByTestId("preview").textContent).toBe("mode=dark");
  });

  it("flags changed rows via data-pm-token-changed", () => {
    const { container } = render(
      <ThemeEditorRoot initialTheme={aurora} tokenIds={["pm.color.surface.base"]} />,
    );
    const row = container.querySelector("[data-pm-token-id='pm.color.surface.base']") as HTMLElement;
    const text = row.querySelector("input[type='text']") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "#abcdef" } });
    const changed = container.querySelector("[data-pm-token-changed='true']");
    expect(changed).toBeTruthy();
  });
});
