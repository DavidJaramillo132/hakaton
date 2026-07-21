import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CropListbox } from "./CropListbox";

describe("CropListbox", () => {
  it("opens options and selects a crop without a native select", () => {
    const onChange = vi.fn();
    render(<CropListbox value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /cultivo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cacao" }));
    expect(onChange).toHaveBeenCalledWith("cacao");
  });
});
