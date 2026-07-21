import { describe, expect, it } from "vitest";
import { extractClimateSummary } from "./climate";

describe("extractClimateSummary", () => {
  it("uses the first daily forecast values", () => {
    expect(extractClimateSummary({ daily: { temperature_2m_max: [29], temperature_2m_min: [22], precipitation_probability_max: [78], relative_humidity_2m_mean: [88] } })).toEqual({ temp_max: 29, temp_min: 22, prob_lluvia: 78, humedad: 88 });
  });
  it("falls back when forecast values are absent", () => {
    expect(extractClimateSummary({})).toEqual({ temp_max: null, temp_min: null, prob_lluvia: null, humedad: null });
  });
});
