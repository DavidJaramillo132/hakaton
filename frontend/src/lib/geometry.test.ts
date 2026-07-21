import { describe, expect, it } from "vitest";
import { calculateCentroid, createMapSelection } from "./geometry";

describe("calculateCentroid", () => {
  it("returns latitude and longitude for a field polygon", () => {
    const point = calculateCentroid({ type: "Polygon", coordinates: [[[-80.6, -1.1], [-80.4, -1.1], [-80.4, -0.9], [-80.6, -0.9], [-80.6, -1.1]]] });
    expect(point.lat).toBeCloseTo(-1);
    expect(point.lon).toBeCloseTo(-80.5);
  });
  it("keeps the polygon and centroid together for map state", () => {
    const polygon: GeoJSON.Polygon = { type: "Polygon", coordinates: [[[-80.6, -1.1], [-80.4, -1.1], [-80.4, -0.9], [-80.6, -0.9], [-80.6, -1.1]]] };
    const selection = createMapSelection(polygon);
    expect(JSON.parse(selection.geojson)).toEqual(polygon);
    expect(selection.centroide).toEqual({ lat: -1, lon: -80.5 });
  });
});
