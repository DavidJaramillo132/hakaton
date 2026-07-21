import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoPicker } from "./PhotoPicker";

describe("PhotoPicker", () => {
  it("adds a valid selected photo", () => {
    const onChange = vi.fn();
    render(<PhotoPicker photos={[]} onChange={onChange} onError={vi.fn()} />);
    const file = new File(["photo"], "cultivo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Arrastra fotos/i), { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ file, descripcion: "" })]));
  });
});
