import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatmapControl } from "./HeatmapControl";

describe("HeatmapControl", () => {
  it("activa la carga desde el botón", () => {
    const onToggle = vi.fn();
    render(<HeatmapControl visible={false} loading={false} error={null} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver mapa de riesgo" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("muestra estado de carga y deshabilita el botón", () => {
    render(<HeatmapControl visible={false} loading error={null} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cargando riesgo…" })).toBeDisabled();
  });

  it("permite reintentar un error y muestra la leyenda al estar visible", () => {
    const onToggle = vi.fn();
    render(<HeatmapControl visible loading={false} error="Sin conexión" onToggle={onToggle} />);
    expect(screen.getByText("Riesgo climático territorial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
