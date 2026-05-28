import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LintPanel } from "../src/lint-panel.js";
import type { LintWarning } from "@polymorph/core";

const w = (over: Partial<LintWarning> = {}): LintWarning => ({
  code: "CONTRAST_TEXT_LOW",
  message: "low contrast",
  tokenIds: ["pm.color.text.body", "pm.color.surface.base"],
  measured: 1.1,
  threshold: 4.5,
  ...over,
});

describe("LintPanel", () => {
  it("renders the empty state when there are no warnings", () => {
    const { container } = render(<LintPanel warnings={[]} />);
    expect(container.querySelector("[data-pm-lint-empty='true']")).toBeTruthy();
  });

  it("renders each warning with its code as a data attribute", () => {
    const { container } = render(<LintPanel warnings={[w(), w({ code: "FOCUS_RING_LOW" })]} />);
    expect(container.querySelectorAll("[data-pm-lint-code]").length).toBe(2);
    expect(container.querySelector("[data-pm-lint-code='FOCUS_RING_LOW']")).toBeTruthy();
  });

  it("marks rows that reference the highlighted token", () => {
    const { container } = render(
      <LintPanel warnings={[w({ tokenIds: ["pm.color.surface.base"] }), w({ tokenIds: ["pm.color.text.muted"] })]} highlightedTokenId="pm.color.surface.base" />,
    );
    const highlighted = container.querySelectorAll("[data-pm-highlighted-token='true']");
    expect(highlighted.length).toBe(1);
  });

  it("invokes onActivate when a row is clicked", () => {
    const onActivate = vi.fn();
    render(<LintPanel warnings={[w()]} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("disables the activate button when no handler is provided", () => {
    render(<LintPanel warnings={[w()]} />);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
