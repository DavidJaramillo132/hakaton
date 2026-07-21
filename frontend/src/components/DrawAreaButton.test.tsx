import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DrawAreaButton } from "./DrawAreaButton";

describe("DrawAreaButton", () => {
  it("starts polygon drawing when it is ready", () => {
    const onStart = vi.fn();
    render(<DrawAreaButton ready onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /dibujar área/i }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.getByText(/marca cada esquina/i)).toBeInTheDocument();
  });

  it("waits for the map drawing tool before enabling the action", () => {
    render(<DrawAreaButton ready={false} onStart={() => undefined} />);
    expect(screen.getByRole("button", { name: /dibujar área/i })).toBeDisabled();
  });
});
