import * as turf from "@turf/turf";
import type { Coordinates, MapSelection } from "../types";

export function calculateCentroid(geojson: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>): Coordinates {
  const feature = geojson.type === "Feature" ? geojson : turf.feature(geojson);
  const [lon, lat] = turf.centroid(feature).geometry.coordinates;
  return { lat, lon };
}

export function serializePolygon(layer: L.Polygon): string {
  return JSON.stringify(layer.toGeoJSON().geometry);
}

export function createMapSelection(geojson: GeoJSON.Polygon): MapSelection {
  return { geojson: JSON.stringify(geojson), centroide: calculateCentroid(geojson) };
}

export function selectionFromLayer(layer: L.Polygon): MapSelection {
  const geometry = layer.toGeoJSON().geometry;
  if (geometry.type !== "Polygon") throw new Error("El área debe ser un polígono.");
  return createMapSelection(geometry);
}

export function parsePolygon(geojson: string): GeoJSON.Polygon {
  const parsed: unknown = JSON.parse(geojson);
  if (!parsed || typeof parsed !== "object" || (parsed as { type?: string }).type !== "Polygon") {
    throw new Error("El área guardada no tiene un formato válido.");
  }
  return parsed as GeoJSON.Polygon;
}
