import { useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CropListbox } from "./components/CropListbox";
import { MapEditor } from "./components/MapEditor";
import { PhotoPicker } from "./components/PhotoPicker";
import { RiskResult } from "./components/RiskResult";
import { analyzeField, createField, uploadPhotos } from "./lib/api";
import { extractClimateSummary } from "./lib/climate";
import { signOut } from "./lib/auth";
import { validatePhotos } from "./lib/validation";
import type { ApiAnalysisResponse, Campo, Cultivo, MapSelection, PendingPhoto } from "./types";

type Panel = "form" | "loading" | "result";
type ResultState = { field: Campo; response: ApiAnalysisResponse };
const errorText = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error inesperado. Inténtalo nuevamente.";

export function Program({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [selection, setSelection] = useState<MapSelection | null>(null); const [nombre, setNombre] = useState(""); const [cultivo, setCultivo] = useState<Cultivo | "">(""); const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [panel, setPanel] = useState<Panel>("form"); const [error, setError] = useState<string | null>(null); const [result, setResult] = useState<ResultState | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const analyze = async () => {
    if (!selection || !cultivo) return;
    const photoError = validatePhotos(photos); if (photoError) { setError(photoError); return; }
    setError(null); setPanel("loading");
    try {
      const field = await createField({ nombre: nombre.trim() || "Campo sin nombre", cultivo, geojson: selection.geojson }, user.id);
      await uploadPhotos(field.id, photos);
      const response = await analyzeField(field, selection.centroide);
      setResult({ field, response }); setPanel("result");
    } catch (issue) { setError(errorText(issue)); setPanel("form"); }
  };
  const reset = () => { photos.forEach((photo) => URL.revokeObjectURL(photo.preview)); setSelection(null); setNombre(""); setCultivo(""); setPhotos([]); setResult(null); setError(null); setPanel("form"); };
  const canAnalyze = Boolean(selection && cultivo) && panel === "form";
  const leave = async () => {
    try { await signOut(); onSignOut(); }
    catch (issue) { setError(errorText(issue)); }
  };
  const showResults = panel === "result" && result !== null;
  const showResultDetails = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    resultsRef.current?.focus({ preventScroll: true });
  };

  return <div className="min-h-screen bg-[#f5f7f2] text-slate-800"><header className="border-b border-leaf-100 bg-white"><div className="mx-auto flex max-w-[1540px] items-center justify-between px-5 py-4 lg:px-8"><a href="/" className="flex items-center gap-2 font-display text-xl font-bold text-leaf-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-xl text-white">⌁</span>AgroClima <span className="text-amber-600">IA</span></a><div className="flex items-center gap-3"><p className="hidden max-w-52 truncate text-xs font-medium text-slate-500 sm:block">{user.email}</p><span className="flex items-center gap-2 text-xs font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Sesión protegida</span><button className="text-xs font-bold text-leaf-700 underline" onClick={() => void leave()}>Cerrar sesión</button></div></div></header>
    <main className="mx-auto max-w-[1540px] px-5 py-7 lg:px-8 lg:py-10"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">Portoviejo · Manabí</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-leaf-900 sm:text-4xl">Protege tu cultivo antes de que cambie el clima.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Dibuja la parcela y recibe precauciones climáticas específicas para tu cultivo.</p></div>
      {error && <Notice type="error">{error}<button onClick={() => setError(null)} className="ml-auto px-1 text-lg" aria-label="Cerrar error">×</button></Notice>}
      <div className={`grid items-start gap-6 ${showResults ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_390px]"}`}>
        <section className="relative"><MapEditor value={selection} onChange={setSelection} fullWidth={showResults} />{showResults && <button onClick={showResultDetails} className="absolute bottom-16 left-1/2 z-[600] -translate-x-1/2 rounded-full bg-leaf-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-leaf-700 focus:outline-none focus:ring-4 focus:ring-leaf-200" type="button">Ver resultados <span aria-hidden="true">↓</span></button>}<div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${selection ? "bg-leaf-50 text-leaf-700" : "bg-white text-slate-500"}`}><span>{selection ? "✓" : "○"}</span>{selection ? `Área lista · centroide ${selection.centroide.lat.toFixed(4)}, ${selection.centroide.lon.toFixed(4)}` : "Dibuja un polígono para definir el área del cultivo."}</div></section>
        {showResults && result ? <section ref={resultsRef} id="resultados-analisis" tabIndex={-1} aria-labelledby="resultados-title" className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm outline-none sm:p-7"><header className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-leaf-700">Análisis completado</p><h2 id="resultados-title" className="mt-1 font-display text-3xl font-bold text-leaf-900">{result.field.nombre}</h2><p className="mt-1 text-sm capitalize text-slate-500">Cultivo de {result.field.cultivo}</p></div><button onClick={reset} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">← Nuevo análisis</button></header><RiskResult campo={result.field} response={result.response} climate={extractClimateSummary(result.response.analisis.clima_json)} onNew={reset} /></section> : <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{panel === "form" && <FormPanel nombre={nombre} cultivo={cultivo} photos={photos} canAnalyze={canAnalyze} onName={setNombre} onCultivo={setCultivo} onPhotos={setPhotos} onError={setError} onAnalyze={analyze} />}{panel === "loading" && <LoadingPanel />}</aside>}
      </div></main></div>;
}

function FormPanel({ nombre, cultivo, photos, canAnalyze, onName, onCultivo, onPhotos, onError, onAnalyze }: { nombre: string; cultivo: Cultivo | ""; photos: PendingPhoto[]; canAnalyze: boolean; onName: (value: string) => void; onCultivo: (value: Cultivo) => void; onPhotos: (photos: PendingPhoto[]) => void; onError: (message: string | null) => void; onAnalyze: () => void }) { return <><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-leaf-700">Nuevo análisis</p><h2 className="mt-1 font-display text-2xl font-bold text-leaf-900">Datos del cultivo</h2></div><div className="space-y-5"><label className="block text-sm font-semibold text-slate-700">Nombre del campo <span className="font-normal text-slate-400">(opcional)</span><input value={nombre} onChange={(event) => onName(event.target.value)} placeholder="Ej. Finca La Esperanza" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100" /></label><CropListbox value={cultivo} onChange={onCultivo} /><PhotoPicker photos={photos} onChange={onPhotos} onError={onError} /><button onClick={onAnalyze} disabled={!canAnalyze} className="w-full rounded-xl bg-leaf-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-slate-300">Analizar riesgo climático <span className="ml-1">→</span></button><p className="text-center text-xs text-slate-500">{canAnalyze ? "Listo para analizar tu parcela." : "Selecciona el área y un cultivo para continuar."}</p></div></>; }
function Notice({ type, children }: { type: "error" | "warning"; children: React.ReactNode }) { return <div className={`mx-auto mb-4 flex max-w-[1540px] items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{children}</div>; }
function LoadingPanel() { return <div aria-live="polite"><div className="flex items-center gap-3"><span className="h-9 w-9 animate-spin rounded-full border-4 border-leaf-100 border-t-leaf-600" /><div><p className="font-display text-2xl font-bold text-leaf-900">Analizando…</p><p className="text-sm text-slate-500">Consultando clima y riesgos para tu cultivo.</p></div></div><div className="mt-8 animate-pulse space-y-3"><div className="h-32 rounded-2xl bg-slate-100" /><div className="h-28 rounded-2xl bg-slate-100" /><div className="h-20 rounded-2xl bg-slate-100" /></div></div>; }
