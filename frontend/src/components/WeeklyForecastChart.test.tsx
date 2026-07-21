import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeeklyForecastChart } from "./WeeklyForecastChart";

const days = [{ fecha: "2026-07-21", etiqueta: "Hoy", lluvia: 78, tempMax: 29, tempMin: 22, humedad: 88, viento: 28, riesgo: { puntuacion: 68, nivel: "alto" as const } }, { fecha: "2026-07-22", etiqueta: "Mañana", lluvia: 15, tempMax: 30, tempMin: 22, humedad: 60, viento: 12, riesgo: { puntuacion: 24, nivel: "bajo" as const } }];

describe("WeeklyForecastChart", () => {
  it("muestra una ficha flotante al pasar por un día", () => {
    render(<WeeklyForecastChart days={days} />);
    expect(screen.getByRole("heading", { name: "Pronóstico de 7 días" })).toBeInTheDocument();
    expect(screen.getByText("Lluvia")).toBeInTheDocument();
    const tomorrow = screen.getByRole("button", { name: /Mañana: lluvia 15%/i });
    fireEvent.mouseEnter(tomorrow);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Mañana");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Riesgo bajo");
    expect(screen.getByRole("tooltip")).toHaveTextContent("12 km/h");
    fireEvent.mouseLeave(tomorrow);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("abre la ficha con teclado y Escape la cierra", () => {
    render(<WeeklyForecastChart days={days} />);
    const tomorrow = screen.getByRole("button", { name: /Mañana: lluvia 15%/i });
    fireEvent.focus(tomorrow);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Mañana");
    fireEvent.keyDown(tomorrow, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("shows a compact unavailable state without forecast data", () => {
    render(<WeeklyForecastChart days={[]} />);
    expect(screen.getByText(/No hay datos suficientes/i)).toBeInTheDocument();
  });
});
