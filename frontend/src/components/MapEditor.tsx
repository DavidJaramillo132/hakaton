import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { parsePolygon, selectionFromLayer } from "../lib/geometry";
import type { MapSelection } from "../types";

const PORTOVIEJO_CENTER: [number, number] = [-1.0546, -80.4547];
type Props = { value: MapSelection | null; onChange: (selection: MapSelection | null) => void };

function DrawingControls({ value, onChange }: Props) {
  const map = useMap();
  const group = useRef(new L.FeatureGroup());
  const lastGeojson = useRef<string | null>(null);

  useEffect(() => {
    const featureGroup = group.current;
    map.addLayer(featureGroup);
    const control = new L.Control.Draw({
      edit: { featureGroup, remove: true },
      draw: { polygon: { allowIntersection: false, shapeOptions: { color: "#287247", fillColor: "#79ad60", fillOpacity: 0.24 } }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
    });
    const setPolygon = (layer: L.Layer) => {
      featureGroup.clearLayers();
      featureGroup.addLayer(layer);
      const selection = selectionFromLayer(layer as L.Polygon);
      lastGeojson.current = selection.geojson;
      onChange(selection);
    };
    const created: L.LeafletEventHandlerFn = (event) => setPolygon((event as L.DrawEvents.Created).layer);
    const edited: L.LeafletEventHandlerFn = () => {
      const layer = featureGroup.getLayers()[0];
      if (layer) setPolygon(layer);
    };
    const deleted: L.LeafletEventHandlerFn = () => { lastGeojson.current = null; onChange(null); };
    map.addControl(control);
    map.on(L.Draw.Event.CREATED, created);
    map.on(L.Draw.Event.EDITED, edited);
    map.on(L.Draw.Event.DELETED, deleted);
    return () => { map.off(L.Draw.Event.CREATED, created); map.off(L.Draw.Event.EDITED, edited); map.off(L.Draw.Event.DELETED, deleted); map.removeControl(control); map.removeLayer(featureGroup); };
  }, [map, onChange]);

  useEffect(() => {
    if (value?.geojson === lastGeojson.current) return;
    const featureGroup = group.current;
    featureGroup.clearLayers();
    lastGeojson.current = value?.geojson ?? null;
    if (!value) return;
    try {
      const layer = L.geoJSON(parsePolygon(value.geojson), { style: { color: "#287247", fillColor: "#79ad60", fillOpacity: 0.24 } }).getLayers()[0] as L.Polygon;
      featureGroup.addLayer(layer);
      map.fitBounds(layer.getBounds(), { padding: [30, 30] });
    } catch { onChange(null); }
  }, [map, onChange, value]);
  return null;
}

export function MapEditor({ value, onChange }: Props) {
  return <div className="relative h-[500px] overflow-hidden rounded-2xl border border-leaf-100 bg-leaf-50 shadow-inner sm:h-[620px]" aria-label="Mapa para dibujar el área del cultivo">
    <MapContainer center={PORTOVIEJO_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <DrawingControls value={value} onChange={onChange} />
    </MapContainer>
    <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-leaf-900 shadow-lg">Selecciona la herramienta de polígono y marca tu parcela.</div>
  </div>;
}
