import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeeklyForecastChart } from "./WeeklyForecastChart";

const days = [{ fecha: "2026-07-21", etiqueta: "Hoy", lluvia: 78, tempMax: 29, tempMin: 22, humedad: 88, viento: 28, riesgo: { puntuacion: 68, nivel: "alto" as const } }, { fecha: "2026-07-22", etiqueta: "Mañana", lluvia: 15, tempMax: 30, tempMin: 22, humedad: 60, viento: 12, riesgo: { puntuacion: 24, nivel: "bajo" as const } }];

describe("WeeklyForecastChart", () => {
  it("renders rainfall, temperature, risk and an accessible day detail", () => {
    render(<WeeklyForecastChart days={days} />);
    expect(screen.getByRole("heading", { name: "Pronóstico de 7 días" })).toBeInTheDocument();
    expect(screen.getByText("Lluvia")).toBeInTheDocument();
    fireEvent.focus(screen.getByRole("button", { name: /Mañana: lluvia 15%/i }));
    expect(screen.getByText(/Mañana:/)).toBeInTheDocument();
  });
  it("shows a compact unavailable state without forecast data", () => {
    render(<WeeklyForecastChart days={[]} />);
    expect(screen.getByText(/No hay datos suficientes/i)).toBeInTheDocument();
  });
});
