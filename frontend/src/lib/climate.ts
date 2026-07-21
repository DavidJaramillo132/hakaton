import type { ClimaResumen } from "../types";

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
