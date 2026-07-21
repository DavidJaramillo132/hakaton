import type { HeatmapPoint, HeatmapResponse, HeatmapRiskLevel } from "../types";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function climateRiskIndex({ lluviaMm, probLluvia, humedad, vientoKmh }: { lluviaMm: number; probLluvia: number; humedad: number; vientoKmh: number }) {
  const rain = Math.max(clamp(probLluvia), clamp((lluviaMm / 25) * 100));
  const humidity = clamp(((humedad - 60) / 40) * 100);
  const wind = clamp(((vientoKmh - 20) / 40) * 100);
  return Math.round((rain * 0.45) + (humidity * 0.35) + (wind * 0.2));
}

export function heatmapRiskLevel(index: number): HeatmapRiskLevel {
  if (index <= 33) return "bajo";
  if (index <= 66) return "medio";
  return "alto";
}

export function heatmapColor(level: HeatmapRiskLevel) {
  return { bajo: "#22a06b", medio: "#e59b22", alto: "#d84b4b" }[level];
}

function isPoint(value: unknown): value is HeatmapPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return typeof point.ciudad === "string" && point.ciudad.length > 0 && typeof point.lat === "number" && typeof point.lon === "number" && typeof point.indice === "number" && (point.nivel === "bajo" || point.nivel === "medio" || point.nivel === "alto") && typeof point.lluvia_mm === "number" && typeof point.prob_lluvia === "number" && typeof point.humedad === "number" && typeof point.viento_kmh === "number";
}

export function parseHeatmapResponse(value: unknown): HeatmapResponse {
  if (!value || typeof value !== "object") throw new Error("La capa de riesgo devolvió una respuesta inválida.");
  const data = value as Record<string, unknown>;
  if (typeof data.generado_en !== "string" || !Array.isArray(data.puntos) || data.puntos.length !== 24 || !data.puntos.every(isPoint)) {
    throw new Error("La capa de riesgo devolvió una respuesta incompleta.");
  }
  return data as HeatmapResponse;
}
