import { describe, expect, it } from "vitest";
import { climateRiskIndex, heatmapColor, heatmapRiskLevel, parseHeatmapResponse } from "./heatmap";

describe("heatmap climate risk", () => {
  it("combina lluvia, humedad y viento con los pesos definidos", () => {
    expect(climateRiskIndex({ lluviaMm: 25, probLluvia: 20, humedad: 100, vientoKmh: 60 })).toBe(100);
    expect(climateRiskIndex({ lluviaMm: 0, probLluvia: 0, humedad: 60, vientoKmh: 20 })).toBe(0);
  });

  it("clasifica y colorea los tres niveles", () => {
    expect(heatmapRiskLevel(33)).toBe("bajo");
    expect(heatmapRiskLevel(34)).toBe("medio");
    expect(heatmapRiskLevel(67)).toBe("alto");
    expect(heatmapColor("alto")).toBe("#d84b4b");
  });

  it("rechaza una respuesta incompleta de la función", () => {
    expect(() => parseHeatmapResponse({ generado_en: "2026-07-21", puntos: [] })).toThrow("incompleta");
  });

  it("acepta las 24 ciudades nacionales identificadas", () => {
    const city = { ciudad: "Quito", lat: -0.18, lon: -78.47, indice: 52, nivel: "medio" as const, lluvia_mm: 4, prob_lluvia: 52, humedad: 73, viento_kmh: 22 };
    expect(parseHeatmapResponse({ generado_en: "2026-07-21", puntos: Array.from({ length: 24 }, () => city) }).puntos).toHaveLength(24);
  });
});
