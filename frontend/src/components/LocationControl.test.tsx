import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocationControl } from "./LocationControl";

describe("LocationControl", () => {
  it("inicia el seguimiento al pulsar Mi ubicación", () => {
    const onToggle = vi.fn();
    render(<LocationControl active={false} loading={false} error={null} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Mi ubicación" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("muestra que el seguimiento puede detenerse", () => {
    render(<LocationControl active loading={false} error={null} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Detener ubicación" })).toHaveAttribute("aria-pressed", "true");
  });

  it("informa un error y permite reintentar", () => {
    const onToggle = vi.fn();
    render(<LocationControl active={false} loading={false} error="Permiso de ubicación denegado." onToggle={onToggle} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Permiso de ubicación denegado.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
