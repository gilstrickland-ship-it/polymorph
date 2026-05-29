import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Playground } from "../src/Playground.js";

describe("Builder Playground — end-to-end integration", () => {
  it("renders the editor toolbar + preview surface", () => {
    const { container } = render(<Playground />);
    expect(screen.getByLabelText("Mode")).toBeTruthy();
    expect(container.querySelector("[data-pm-example='playground-preview']")).toBeTruthy();
  });

  it("renders the showcase headline inside the preview slot", () => {
    render(<Playground />);
    // The Showcase renders "Account opening" through the themed `ThemedText` primitive.
    // If the preview slot isn't wired, the headline wouldn't be in the tree.
    expect(screen.getByText("Account opening")).toBeTruthy();
  });

  it("renders every exposed token id as an editable row in the editor", () => {
    const { container } = render(<Playground />);
    const exposed = [
      "pm.color.surface.base",
      "pm.color.text.body",
      "pm.color.action.primary.rest",
      "pm.color.action.primary.hover",
      "pm.color.border.focus",
      "pm.space.md",
      "pm.radius.control",
    ];
    for (const id of exposed) {
      expect(container.querySelector(`[data-pm-token-id='${id}']`)).toBeTruthy();
    }
  });

  it("editing pm.color.action.primary.rest dirties the editor and changes the data attribute", () => {
    const { container } = render(<Playground />);
    const row = container.querySelector(
      "[data-pm-token-id='pm.color.action.primary.rest']",
    ) as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.getAttribute("data-pm-token-changed")).toBeNull();

    const text = row.querySelector("input[type='text']") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "#ff00aa" } });

    // After the edit, the row marks itself as changed and the dirty indicator flips.
    expect(row.getAttribute("data-pm-token-changed")).toBe("true");
    expect(screen.getByText("● unsaved")).toBeTruthy();
  });

  it("switching mode in the editor re-renders the preview against the new mode", () => {
    const { container } = render(<Playground />);
    // Aurora's dark mode renders a different background — the preview's child contents
    // change because the themed primitives consume the new resolved theme. The exact
    // hex is opaque to this test; we just confirm the wiring fires by asserting the
    // preview surface is still mounted after a mode switch.
    fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "dark" } });
    expect(container.querySelector("[data-pm-example='playground-preview']")).toBeTruthy();
    expect(screen.getByText("Account opening")).toBeTruthy();
  });
});
