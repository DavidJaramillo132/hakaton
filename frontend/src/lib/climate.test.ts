import { describe, expect, it } from "vitest";
import { calculateDailyRisk, compareRisk, extractClimateSummary, extractWeeklyForecast, generateActionPlan, simulateForecast } from "./climate";

describe("extractClimateSummary", () => {
  it("uses the first daily forecast values", () => {
    expect(extractClimateSummary({ daily: { temperature_2m_max: [29], temperature_2m_min: [22], precipitation_probability_max: [78], relative_humidity_2m_mean: [88] } })).toEqual({ temp_max: 29, temp_min: 22, prob_lluvia: 78, humedad: 88 });
  });
  it("falls back when forecast values are absent", () => {
    expect(extractClimateSummary({})).toEqual({ temp_max: null, temp_min: null, prob_lluvia: null, humedad: null });
  });
  it("extracts seven labeled forecast days", () => {
    const forecast = extractWeeklyForecast({ daily: { time: ["2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28"], temperature_2m_max: [29, 30, 31, 32, 33, 30, 29, 28], temperature_2m_min: [22, 22, 23, 22, 23, 21, 21, 21], precipitation_probability_max: [78, 12, 20, 35, 88, 70, 15, 10], relative_humidity_2m_mean: [88, 70, 68, 72, 90, 84, 61, 60], wind_speed_10m_max: [28, 12, 14, 18, 34, 22, 10, 11] } });
    expect(forecast).toHaveLength(7);
    expect(forecast[0]).toMatchObject({ etiqueta: "Hoy", lluvia: 78, tempMax: 29 });
    expect(forecast[1].etiqueta).toBe("Mañana");
  });
  it("calculates low, medium and high preventive risk", () => {
    expect(calculateDailyRisk({ lluvia: 10, humedad: 20, tempMax: 28, tempMin: 22, viento: 10 })).toMatchObject({ nivel: "bajo" });
    expect(calculateDailyRisk({ lluvia: 50, humedad: 50, tempMax: 30, tempMin: 20, viento: 20 })).toMatchObject({ nivel: "medio" });
    expect(calculateDailyRisk({ lluvia: 80, humedad: 90, tempMax: 34, tempMin: 22, viento: 30 })).toMatchObject({ nivel: "alto" });
  });
  it("generates a seven-day action plan and simulates adjustments", () => {
    const days = extractWeeklyForecast({ daily: { time: ["2026-07-21", "2026-07-22"], temperature_2m_max: [29, 30], temperature_2m_min: [22, 22], precipitation_probability_max: [10, 20], relative_humidity_2m_mean: [60, 70], wind_speed_10m_max: [10, 10] } });
    expect(generateActionPlan(days)).toHaveLength(2);
    const simulated = simulateForecast(days, { lluvia: 20, temperatura: -3, humedad: 10, viento: 5 });
    expect(simulated[0].lluvia).toBe(12);
    expect(simulated[0].tempMax).toBe(26);
    expect(compareRisk(days, simulated)).toHaveProperty("delta");
  });
});
