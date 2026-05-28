import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorField } from "../src/fields/color-field.js";
import { DimensionField } from "../src/fields/dimension-field.js";
import { DurationField } from "../src/fields/duration-field.js";
import { NumberField } from "../src/fields/number-field.js";
import { CubicBezierField } from "../src/fields/cubic-bezier-field.js";
import { TokenField } from "../src/fields/token-field.js";

describe("ColorField", () => {
  it("renders both a picker + a text input", () => {
    const { container } = render(<ColorField value="#1f5cff" onChange={() => {}} label="Surface" />);
    expect(container.querySelector("input[type='color']")).toBeTruthy();
    expect(container.querySelector("input[type='text']")).toBeTruthy();
  });

  it("emits the new hex on text-input change", () => {
    const onChange = vi.fn();
    render(<ColorField value="#000000" onChange={onChange} label="A" />);
    const text = screen.getByLabelText("A") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "#abcdef" } });
    expect(onChange).toHaveBeenCalledWith("#abcdef");
  });

  it("marks invalid hex with aria-invalid", () => {
    render(<ColorField value="garbage" onChange={() => {}} label="A" />);
    const text = screen.getByLabelText("A") as HTMLInputElement;
    expect(text.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("DimensionField", () => {
  it("emits a value-only change preserving the unit", () => {
    const onChange = vi.fn();
    render(<DimensionField value={{ value: 8, unit: "px" }} onChange={onChange} label="Space" />);
    const num = screen.getByLabelText("Space (value)") as HTMLInputElement;
    fireEvent.change(num, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith({ value: 12, unit: "px" });
  });

  it("emits a unit-only change preserving the value", () => {
    const onChange = vi.fn();
    render(<DimensionField value={{ value: 8, unit: "px" }} onChange={onChange} label="Space" />);
    const unit = screen.getByLabelText("Space (unit)") as HTMLSelectElement;
    fireEvent.change(unit, { target: { value: "rem" } });
    expect(onChange).toHaveBeenCalledWith({ value: 8, unit: "rem" });
  });
});

describe("DurationField", () => {
  it("offers ms + s and toggles the unit", () => {
    const onChange = vi.fn();
    render(<DurationField value={{ value: 200, unit: "ms" }} onChange={onChange} label="Speed" />);
    const unit = screen.getByLabelText("Speed (unit)") as HTMLSelectElement;
    expect(unit.options.length).toBe(2);
    fireEvent.change(unit, { target: { value: "s" } });
    expect(onChange).toHaveBeenCalledWith({ value: 200, unit: "s" });
  });
});

describe("NumberField", () => {
  it("emits the new number", () => {
    const onChange = vi.fn();
    render(<NumberField value={0.4} onChange={onChange} label="Opacity" min={0} max={1} step={0.05} />);
    const num = screen.getByLabelText("Opacity") as HTMLInputElement;
    fireEvent.change(num, { target: { value: "0.6" } });
    expect(onChange).toHaveBeenCalledWith(0.6);
  });
});

describe("CubicBezierField", () => {
  it("renders four inputs and emits one slot at a time", () => {
    const onChange = vi.fn();
    render(<CubicBezierField value={[0.4, 0, 0.2, 1]} onChange={onChange} label="Ease" />);
    const y1 = screen.getByLabelText("Ease y1") as HTMLInputElement;
    fireEvent.change(y1, { target: { value: "0.25" } });
    expect(onChange).toHaveBeenCalledWith([0.4, 0.25, 0.2, 1]);
  });
});

describe("TokenField (dispatcher)", () => {
  it("returns null for token types not yet edited visually (typography / shadow)", () => {
    const { container } = render(
      <TokenField $type="typography" value={{ fontFamily: "Inter" }} onChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("dispatches to ColorField for $type=color", () => {
    const { container } = render(<TokenField $type="color" value="#abcdef" onChange={() => {}} />);
    expect(container.querySelector("[data-pm-field='color']")).toBeTruthy();
  });
});
