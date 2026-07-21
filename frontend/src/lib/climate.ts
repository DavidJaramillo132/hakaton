import type { ClimaResumen, IndiceRiesgoDiario, NivelRiesgo, PronosticoDia } from "../types";

function firstNumber(value: unknown): number | null {
  if (!Array.isArray(value) || typeof value[0] !== "number" || !Number.isFinite(value[0])) return null;
  return value[0];
}

export function extractClimateSummary(clima: Record<string, unknown>): ClimaResumen {
  const daily = clima.daily;
  if (!daily || typeof daily !== "object" || Array.isArray(daily)) return { temp_max: null, temp_min: null, prob_lluvia: null, humedad: null };
  const data = daily as Record<string, unknown>;
  return {
    temp_max: firstNumber(data.temperature_2m_max),
    temp_min: firstNumber(data.temperature_2m_min),
    prob_lluvia: firstNumber(data.precipitation_probability_max),
    humedad: firstNumber(data.relative_humidity_2m_mean),
  };
}

function numberAt(value: unknown, index: number): number | null {
  return Array.isArray(value) && typeof value[index] === "number" && Number.isFinite(value[index]) ? value[index] : null;
}

function stringAt(value: unknown, index: number): string | null {
  return Array.isArray(value) && typeof value[index] === "string" ? value[index] : null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function level(score: number): NivelRiesgo {
  return score >= 65 ? "alto" : score >= 35 ? "medio" : "bajo";
}

export function calculateDailyRisk(input: Pick<PronosticoDia, "lluvia" | "humedad" | "tempMax" | "tempMin" | "viento">): IndiceRiesgoDiario | null {
  const parts: Array<[number, number]> = [];
  if (input.lluvia !== null) parts.push([clamp(input.lluvia), 0.4]);
  if (input.humedad !== null) parts.push([clamp(input.humedad), 0.35]);
  const heat = input.tempMax === null ? null : clamp(((input.tempMax - 30) / 8) * 100);
  const cold = input.tempMin === null ? null : clamp(((20 - input.tempMin) / 8) * 100);
  if (heat !== null || cold !== null) parts.push([Math.max(heat ?? 0, cold ?? 0), 0.15]);
  if (input.viento !== null) parts.push([clamp(((input.viento - 20) / 30) * 100), 0.1]);
  if (!parts.length) return null;
  const score = Math.round(parts.reduce((total, [value, weight]) => total + value * weight, 0) / parts.reduce((total, [, weight]) => total + weight, 0));
  return { puntuacion: score, nivel: level(score) };
}

function labelForDate(date: string, index: number) {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  const weekday = new Intl.DateTimeFormat("es-EC", { weekday: "short" }).format(new Date(`${date}T12:00:00`)).replace(".", "");
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function extractWeeklyForecast(clima: Record<string, unknown>): PronosticoDia[] {
  const daily = clima.daily;
  if (!daily || typeof daily !== "object" || Array.isArray(daily)) return [];
  const data = daily as Record<string, unknown>;
  if (!Array.isArray(data.time)) return [];
  return data.time.slice(0, 7).flatMap((_, index) => {
    const fecha = stringAt(data.time, index);
    if (!fecha) return [];
    const base = {
      fecha,
      etiqueta: labelForDate(fecha, index),
      tempMax: numberAt(data.temperature_2m_max, index),
      tempMin: numberAt(data.temperature_2m_min, index),
      lluvia: numberAt(data.precipitation_probability_max, index),
      humedad: numberAt(data.relative_humidity_2m_mean, index),
      viento: numberAt(data.wind_speed_10m_max, index),
    };
    const riesgo = calculateDailyRisk(base);
    return base.tempMax !== null || base.tempMin !== null || base.lluvia !== null || base.humedad !== null || base.viento !== null ? [{ ...base, riesgo }] : [];
  });
}
