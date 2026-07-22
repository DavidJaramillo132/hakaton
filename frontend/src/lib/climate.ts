import type { AccionDia, ClimaResumen, IndiceRiesgoDiario, NivelRiesgo, PronosticoDia, SimulacionAjustes } from "../types";

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

export function generateActionPlan(days: PronosticoDia[]): AccionDia[] {
  return days.slice(0, 7).map((day) => {
    const risk = day.riesgo?.nivel ?? "bajo";
    const accion = (day.lluvia ?? 0) >= 70 ? "Revisar drenaje y evitar labores con suelo saturado" : (day.humedad ?? 0) >= 80 ? "Inspeccionar hojas y mantener ventilación" : (day.viento ?? 0) >= 35 ? "Asegurar tutores y evitar aplicaciones" : risk === "bajo" ? "Ventana ideal para labores del cultivo" : "Monitorear el cultivo y ajustar labores";
    const motivo = (day.lluvia ?? 0) >= 70 ? "La probabilidad de lluvia elevada puede saturar el suelo." : (day.humedad ?? 0) >= 80 ? "La humedad alta favorece condiciones de presión sanitaria." : (day.viento ?? 0) >= 35 ? "El viento puede dispersar aplicaciones y dañar plantas." : "Las condiciones previstas permiten labores preventivas.";
    return { fecha: day.fecha, etiqueta: day.etiqueta, accion, motivo, nivel_riesgo: risk };
  });
}

export function simulateForecast(days: PronosticoDia[], adjustments: SimulacionAjustes): PronosticoDia[] {
  return days.map((day) => ({ ...day, lluvia: day.lluvia === null ? null : Math.min(100, Math.max(0, day.lluvia * (1 + adjustments.lluvia / 100))), tempMax: day.tempMax === null ? null : day.tempMax + adjustments.temperatura, tempMin: day.tempMin === null ? null : day.tempMin + adjustments.temperatura, humedad: day.humedad === null ? null : Math.min(100, Math.max(0, day.humedad + adjustments.humedad)), viento: day.viento === null ? null : Math.max(0, day.viento + adjustments.viento) })).map((day) => ({ ...day, riesgo: calculateDailyRisk(day) }));
}

export function compareRisk(original: PronosticoDia[], simulated: PronosticoDia[]) {
  const originalScore = original.reduce((sum, day) => sum + (day.riesgo?.puntuacion ?? 0), 0) / Math.max(1, original.length);
  const simulatedScore = simulated.reduce((sum, day) => sum + (day.riesgo?.puntuacion ?? 0), 0) / Math.max(1, simulated.length);
  return { original: Math.round(originalScore), simulated: Math.round(simulatedScore), delta: Math.round(simulatedScore - originalScore) };
}
