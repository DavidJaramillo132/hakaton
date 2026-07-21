import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet-draw";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { heatmapColor } from "../lib/heatmap";
import { loadHeatmapRisk } from "../lib/api";
import { parsePolygon, selectionFromLayer } from "../lib/geometry";
import type { HeatmapResponse, MapSelection } from "../types";
import { HeatmapControl } from "./HeatmapControl";
import { LocationControl } from "./LocationControl";
import { DrawAreaButton } from "./DrawAreaButton";

const PORTOVIEJO_CENTER: [number, number] = [-1.0546, -80.4547];
type Props = { value: MapSelection | null; onChange: (selection: MapSelection | null) => void; fullWidth?: boolean };
type DrawingProps = Props & { onDrawingReady: (start: (() => void) | null) => void };
const polygonOptions: L.DrawOptions.PolygonOptions = { allowIntersection: false, shapeOptions: { color: "#287247", fillColor: "#79ad60", fillOpacity: 0.24 } };

function MapSizeSync({ fullWidth }: { fullWidth: boolean }) {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [fullWidth, map]);
  return null;
}

function DrawingControls({ value, onChange, onDrawingReady }: DrawingProps) {
  const map = useMap();
  const group = useRef(new L.FeatureGroup());
  const lastGeojson = useRef<string | null>(null);

  useEffect(() => {
    const featureGroup = group.current;
    map.addLayer(featureGroup);
    const control = new L.Control.Draw({
      edit: { featureGroup, remove: true },
      draw: { polygon: polygonOptions, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
    });
    // Leaflet Draw augments the runtime map; its type declarations expose that augmentation as DrawMap.
    const polygonDrawer = new L.Draw.Polygon(map as L.DrawMap, polygonOptions);
    const setPolygon = (layer: L.Layer) => {
      featureGroup.clearLayers();
      featureGroup.addLayer(layer);
      const selection = selectionFromLayer(layer as L.Polygon);
      lastGeojson.current = selection.geojson;
      onChange(selection);
    };
    const created: L.LeafletEventHandlerFn = (event) => setPolygon((event as L.DrawEvents.Created).layer);
    const edited: L.LeafletEventHandlerFn = () => { const layer = featureGroup.getLayers()[0]; if (layer) setPolygon(layer); };
    const deleted: L.LeafletEventHandlerFn = () => { lastGeojson.current = null; onChange(null); };
    map.addControl(control);
    onDrawingReady(() => polygonDrawer.enable());
    map.on(L.Draw.Event.CREATED, created); map.on(L.Draw.Event.EDITED, edited); map.on(L.Draw.Event.DELETED, deleted);
    return () => { onDrawingReady(null); polygonDrawer.disable(); map.off(L.Draw.Event.CREATED, created); map.off(L.Draw.Event.EDITED, edited); map.off(L.Draw.Event.DELETED, deleted); map.removeControl(control); map.removeLayer(featureGroup); };
  }, [map, onChange, onDrawingReady]);

  useEffect(() => {
    if (value?.geojson === lastGeojson.current) return;
    const featureGroup = group.current;
    featureGroup.clearLayers(); lastGeojson.current = value?.geojson ?? null;
    if (!value) return;
    try {
      const layer = L.geoJSON(parsePolygon(value.geojson), { style: { color: "#287247", fillColor: "#79ad60", fillOpacity: 0.24 } }).getLayers()[0] as L.Polygon;
      featureGroup.addLayer(layer); map.fitBounds(layer.getBounds(), { padding: [30, 30] });
    } catch { onChange(null); }
  }, [map, onChange, value]);
  return null;
}

function riskPopup(point: HeatmapResponse["puntos"][number]) {
  const level = point.nivel[0].toUpperCase() + point.nivel.slice(1);
  return `<div style="min-width:180px;color:#193c2a;font-family:system-ui,sans-serif"><strong style="font-size:15px">${point.ciudad}</strong><p style="margin:3px 0 10px;color:#64748b;font-size:12px">Riesgo ${level} · ${point.indice}/100</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px"><span>Lluvia<br><b>${point.lluvia_mm.toFixed(1)} mm</b></span><span>Probabilidad<br><b>${point.prob_lluvia}%</b></span><span>Humedad<br><b>${point.humedad}%</b></span><span>Viento máx.<br><b>${point.viento_kmh.toFixed(1)} km/h</b></span></div></div>`;
}

function NationalRiskLayer({ data, visible }: { data: HeatmapResponse | null; visible: boolean }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!data || !visible) return;
    const pane = map.getPane("risk-cities") ?? map.createPane("risk-cities");
    pane.style.zIndex = "380";
    const layer = L.layerGroup(data.puntos.map((point) => {
      const color = heatmapColor(point.nivel);
      const marker = L.marker([point.lat, point.lon], {
        pane: "risk-cities",
        title: `${point.ciudad}: riesgo ${point.indice}/100`,
        icon: L.divIcon({
          className: "",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -18],
          html: `<span style="display:grid;place-items:center;width:38px;height:38px;border:3px solid white;border-radius:9999px;background:${color};color:white;font:700 12px system-ui,sans-serif;box-shadow:0 2px 8px rgba(15,23,42,.35)">${point.indice}</span>`,
        }),
      });
      return marker.bindPopup(riskPopup(point), { closeButton: true, maxWidth: 230 });
    }));
    layer.addTo(map);
    if (!hasFitted.current) {
      map.fitBounds(L.latLngBounds(data.puntos.map((point) => [point.lat, point.lon] as L.LatLngTuple)), { padding: [36, 36], maxZoom: 6 });
      hasFitted.current = true;
    }
    return () => { layer.remove(); };
  }, [data, map, visible]);
  return null;
}

function locationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return "Permiso de ubicación denegado.";
  if (error.code === error.POSITION_UNAVAILABLE) return "La ubicación no está disponible en este momento.";
  if (error.code === error.TIMEOUT) return "La ubicación tardó demasiado. Inténtalo de nuevo.";
  return "No se pudo obtener tu ubicación.";
}

function LiveLocationLayer({ active, onReady, onError, onStopped }: {
  active: boolean;
  onReady: () => void;
  onError: (message: string) => void;
  onStopped: () => void;
}) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!active) return;
    if (!("geolocation" in navigator)) {
      onError("Tu navegador no permite obtener ubicación.");
      onStopped();
      return;
    }
    hasCentered.current = false;
    const pane = map.getPane("live-location") ?? map.createPane("live-location");
    pane.style.zIndex = "625";
    const marker = L.marker([0, 0], {
      pane: "live-location",
      icon: L.divIcon({ className: "", html: '<span class="block h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md"></span>', iconSize: [16, 16], iconAnchor: [8, 8] }),
    });
    const accuracy = L.circle([0, 0], { pane: "live-location", radius: 0, color: "#2563eb", weight: 1, fillColor: "#60a5fa", fillOpacity: 0.16, interactive: false });
    const layer = L.layerGroup([accuracy, marker]).addTo(map);
    const watchId = navigator.geolocation.watchPosition((position) => {
      const latLng = L.latLng(position.coords.latitude, position.coords.longitude);
      marker.setLatLng(latLng);
      accuracy.setLatLng(latLng).setRadius(position.coords.accuracy);
      if (!hasCentered.current) {
        map.setView(latLng, Math.max(map.getZoom(), 15));
        hasCentered.current = true;
      }
      onReady();
    }, (error) => {
      onError(locationError(error));
      onStopped();
    }, { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 });
    return () => { navigator.geolocation.clearWatch(watchId); layer.remove(); };
  }, [active, map, onError, onReady, onStopped]);

  return null;
}

export function MapEditor({ value, onChange, fullWidth = false }: Props) {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [locationActive, setLocationActive] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [startDrawing, setStartDrawing] = useState<(() => void) | null>(null);
  const drawingReady = useCallback((start: (() => void) | null) => setStartDrawing(() => start), []);

  const toggleHeatmap = async () => {
    if (heatmap) { setHeatmapVisible((visible) => !visible); return; }
    setHeatmapLoading(true); setHeatmapError(null);
    try { setHeatmap(await loadHeatmapRisk()); setHeatmapVisible(true); }
    catch (error) { setHeatmapError(error instanceof Error ? error.message : "No se pudo cargar el mapa de riesgo."); }
    finally { setHeatmapLoading(false); }
  };

  const toggleLocation = () => {
    if (locationActive) {
      setLocationActive(false); setLocationLoading(false); setLocationErrorMessage(null);
      return;
    }
    setLocationErrorMessage(null); setLocationLoading(true); setLocationActive(true);
  };
  const locationReady = useCallback(() => setLocationLoading(false), []);
  const locationFailed = useCallback((message: string) => setLocationErrorMessage(message), []);
  const locationStopped = useCallback(() => { setLocationActive(false); setLocationLoading(false); }, []);

  return <div className="relative h-[500px] overflow-hidden rounded-2xl border border-leaf-100 bg-leaf-50 shadow-inner sm:h-[620px]" aria-label="Mapa para dibujar el área del cultivo">
    <MapContainer center={PORTOVIEJO_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapSizeSync fullWidth={fullWidth} />
      <NationalRiskLayer data={heatmap} visible={heatmapVisible} />
      <LiveLocationLayer active={locationActive} onReady={locationReady} onError={locationFailed} onStopped={locationStopped} />
      <DrawingControls value={value} onChange={onChange} onDrawingReady={drawingReady} />
    </MapContainer>
    <DrawAreaButton ready={Boolean(startDrawing)} onStart={() => startDrawing?.()} />
    <HeatmapControl visible={heatmapVisible} loading={heatmapLoading} error={heatmapError} onToggle={() => void toggleHeatmap()} />
    <LocationControl active={locationActive} loading={locationLoading} error={locationErrorMessage} onToggle={toggleLocation} />
    <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-leaf-900 shadow-lg">Usa “Dibujar área”, marca cada esquina y toca el primer punto para cerrar el polígono.</div>
  </div>;
}
