import { describe, expect, it } from "vitest";
import { validateField, validatePhoto } from "./validation";

describe("field validation", () => {
  it("requires a field name, crop and area", () => {
    expect(validateField({ nombre: "", cultivo: "", geojson: null })).toMatch(/Dibuja/);
    expect(validateField({ nombre: "A", cultivo: "cacao", geojson: "{}" })).toMatch(/nombre/);
    expect(validateField({ nombre: "Lote 1", cultivo: "cacao", geojson: "{}" })).toBeNull();
  });
  it("rejects unsupported image formats", () => {
    expect(validatePhoto(new File(["data"], "foto.gif", { type: "image/gif" }))).toMatch(/JPG/);
  });
});
