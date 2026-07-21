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
  it("accepts a dropped photo and permits removing it", () => {
    const file = new File(["photo"], "cultivo.png", { type: "image/png" });
    const photo = { id: "one", file, descripcion: "", preview: "blob:one" };
    const onChange = vi.fn();
    const { rerender } = render(<PhotoPicker photos={[]} onChange={onChange} onError={vi.fn()} />);
    fireEvent.drop(screen.getByText(/Arrastra fotos/i).closest("label")!, { dataTransfer: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ file })]));
    rerender(<PhotoPicker photos={[photo]} onChange={onChange} onError={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Eliminar cultivo.png/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
