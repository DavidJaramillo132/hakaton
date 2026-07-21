import { useState } from "react";
import type { ApiAnalysisResponse, Campo, ClimaResumen } from "../types";
import { guardarAnalisis } from "../lib/save-analysis";
import { extractWeeklyForecast } from "../lib/climate";
import { WeeklyForecastChart } from "./WeeklyForecastChart";

type Props = { campo: Pick<Campo, "nombre" | "cultivo">; response: ApiAnalysisResponse; climate: ClimaResumen; onNew: () => void };
const RISK_STYLE = { bajo: "border-emerald-200 bg-emerald-50 text-emerald-900", medio: "border-amber-200 bg-amber-50 text-amber-950", alto: "border-rose-200 bg-rose-50 text-rose-950" };
const RISK_LABEL = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" };
const datum = (value: number | null, suffix: string) => value === null ? "Sin dato" : `${Math.round(value)}${suffix}`;

export function RiskResult({ campo, response, climate, onNew }: Props) {
  const [saved, setSaved] = useState(false); const [saving, setSaving] = useState(false);
  const result = response.resultado;
  const save = async () => { setSaving(true); await guardarAnalisis(response); setSaved(true); setSaving(false); };
  return <section aria-live="polite" className="grid gap-5 lg:grid-cols-2">
    <div className={`rounded-2xl border p-5 lg:col-span-2 sm:p-6 ${RISK_STYLE[result.nivel_riesgo]}`}><p className="text-xs font-bold uppercase tracking-widest opacity-70">Nivel de riesgo</p><div className="mt-3 flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-xl font-bold">{result.nivel_riesgo === "alto" ? "!" : result.nivel_riesgo === "medio" ? "~" : "✓"}</span><div><h2 className="font-display text-3xl font-bold tracking-tight">{RISK_LABEL[result.nivel_riesgo]}</h2><p className="mt-1 text-base font-semibold capitalize">{result.tipo_riesgo}</p></div></div><p className="mt-4 max-w-4xl text-sm leading-6 opacity-85">{result.justificacion ?? `Análisis preventivo para ${campo.cultivo} en ${campo.nombre}.`}</p></div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Resumen climático</p><div className="mt-4 grid grid-cols-2 gap-3"><Metric icon="☀" label="Máxima" value={datum(climate.temp_max, "°C")} /><Metric icon="◐" label="Mínima" value={datum(climate.temp_min, "°C")} /><Metric icon="☂" label="Lluvia" value={datum(climate.prob_lluvia, "%")} /><Metric icon="≈" label="Humedad" value={datum(climate.humedad, "%")} /></div></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Recomendaciones</p><ul className="mt-4 space-y-3">{result.recomendaciones.map((recommendation) => <li className="flex gap-3 text-sm leading-5 text-slate-700" key={recommendation}><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-100 text-xs font-bold text-leaf-700">✓</span>{recommendation}</li>)}</ul></div>
    <div className="lg:col-span-2"><WeeklyForecastChart days={extractWeeklyForecast(response.analisis.clima_json)} /></div>
    <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">{saved && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 sm:col-span-2">✓ Análisis marcado como guardado.</div>}<button onClick={() => void save()} disabled={saving || saved} className="rounded-xl bg-leaf-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando…" : saved ? "Análisis guardado" : "Guardar análisis"}</button><button onClick={onNew} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">← Analizar otro campo</button></div>
  </section>;
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><span className="text-lg text-leaf-700">{icon}</span><p className="mt-1 text-xs text-slate-500">{label}</p><p className="text-sm font-bold text-slate-800">{value}</p></div>;
}
