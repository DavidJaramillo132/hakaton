import { describe, expect, it } from "vitest";
import { validateAgriculturalDetails, validateField, validatePhoto } from "./validation";

describe("field validation", () => {
  it("requires a field name, crop and area", () => {
    expect(validateField({ nombre: "", cultivo: "", geojson: null })).toMatch(/Dibuja/);
    expect(validateField({ nombre: "A", cultivo: "cacao", geojson: "{}" })).toMatch(/nombre/);
    expect(validateField({ nombre: "Lote 1", cultivo: "cacao", geojson: "{}" })).toBeNull();
  });
  it("rejects unsupported image formats", () => {
    expect(validatePhoto(new File(["data"], "foto.gif", { type: "image/gif" }))).toMatch(/JPG/);
  });
  it("validates optional agricultural dates and age", () => {
    expect(validateAgriculturalDetails({ fecha_siembra: "2099-01-01", edad_cultivo_meses: "", sistema_riego: "", tipo_suelo: "", ultima_aplicacion_fertilizante: "", variedad_cultivo: "" })).toMatch(/siembra/);
    expect(validateAgriculturalDetails({ fecha_siembra: "2026-01-01", edad_cultivo_meses: "-2", sistema_riego: "", tipo_suelo: "", ultima_aplicacion_fertilizante: "", variedad_cultivo: "" })).toMatch(/meses/);
    expect(validateAgriculturalDetails({ fecha_siembra: "2026-01-01", edad_cultivo_meses: "6", sistema_riego: "goteo", tipo_suelo: "franco", ultima_aplicacion_fertilizante: "2026-02-01", variedad_cultivo: "Nacional" })).toBeNull();
  });
});
