import { useMemo, useState } from "react";
import { compareRisk, extractWeeklyForecast, simulateForecast } from "../lib/climate";
import type { SimulacionAjustes } from "../types";

const initial: SimulacionAjustes = { lluvia: 0, temperatura: 0, humedad: 0, viento: 0 };
export function ClimateSimulator({ climate }: { climate: Record<string, unknown> }) {
  const [adjustments, setAdjustments] = useState(initial);
  const days = useMemo(() => extractWeeklyForecast(climate), [climate]);
  const simulated = useMemo(() => simulateForecast(days, adjustments), [adjustments, days]);
  const comparison = useMemo(() => compareRisk(days, simulated), [days, simulated]);
  const set = (key: keyof SimulacionAjustes, value: number) => setAdjustments((current) => ({ ...current, [key]: value }));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="simulator-title"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Explora escenarios</p><h3 id="simulator-title" className="mt-1 font-display text-xl font-bold text-leaf-900">¿Qué pasa si…?</h3><p className="mt-2 text-sm leading-5 text-slate-600">Ajusta las condiciones para ver cómo cambiaría el índice preventivo.</p><div className="mt-4 space-y-3">{([ ["lluvia", "Lluvia", 0, 20, "%"], ["temperatura", "Temperatura", -3, 3, "°C"], ["humedad", "Humedad", 0, 20, "%"], ["viento", "Viento", 0, 20, " km/h"]] as const).map(([key, label, min, max, suffix]) => <label key={key} className="block text-sm font-semibold text-slate-700">{label}: <span className="font-bold text-leaf-700">{adjustments[key] > 0 ? "+" : ""}{adjustments[key]}{suffix}</span><input aria-label={label} type="range" min={min} max={max} step="1" value={adjustments[key]} onChange={(event) => set(key, Number(event.target.value))} className="mt-2 w-full accent-leaf-600" /></label>)}</div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><Metric label="Original" value={`${comparison.original}/100`} /><Metric label="Simulado" value={`${comparison.simulated}/100`} /><Metric label="Cambio" value={`${comparison.delta > 0 ? "+" : ""}${comparison.delta}`} /></div><p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Simulación orientativa sobre el pronóstico actual; no reemplaza un nuevo pronóstico ni la decisión del productor.</p></section>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-2"><p className="text-[11px] text-slate-500">{label}</p><p className="text-sm font-bold text-slate-800">{value}</p></div>; }
