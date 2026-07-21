import { useEffect, useMemo, useState } from "react";
import { loadHistory } from "../lib/api";
import { extractClimateSummary } from "../lib/climate";
import type { Analisis, ApiAnalysisResponse, Campo, HistoryData } from "../types";
import { RiskResult } from "./RiskResult";

type Props = { open: boolean; onClose: () => void; refreshToken?: number };
type Entry = { campo: Campo; analisis: Analisis };
const riskStyle = { bajo: "border-emerald-200 bg-emerald-50 text-emerald-900", medio: "border-amber-200 bg-amber-50 text-amber-950", alto: "border-rose-200 bg-rose-50 text-rose-950" };
const riskLabel = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" };

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function entriesFrom(data: HistoryData): Entry[] {
  const fields = new Map(data.fields.map((field) => [field.id, field]));
  return data.analyses.flatMap((analisis) => {
    const campo = fields.get(analisis.campo_id);
    return campo ? [{ campo, analisis }] : [];
  });
}

export function HistoryDrawer({ open, onClose, refreshToken = 0 }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setSelected(null);
    setLoading(true);
    setError(null);
    void loadHistory().then((data) => {
      if (active) setEntries(entriesFrom(data));
    }).catch((issue) => {
      if (active) setError(issue instanceof Error ? issue.message : "No se pudo cargar el historial.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, refreshToken]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const response = useMemo<ApiAnalysisResponse | null>(() => {
    if (!selected) return null;
    return { resultado: { nivel_riesgo: selected.analisis.nivel_riesgo, tipo_riesgo: selected.analisis.tipo_riesgo, recomendaciones: selected.analisis.recomendaciones }, analisis: selected.analisis };
  }, [selected]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label="Historial de análisis">
    <button type="button" aria-label="Cerrar historial" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35" onClick={onClose} />
    <aside className="absolute right-0 top-0 flex h-full w-[min(440px,calc(100%-1rem))] flex-col overflow-hidden bg-[#f5f7f2] shadow-2xl motion-safe:animate-[slide-in-right_.2s_ease-out]" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-leaf-100 bg-white px-5 py-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-leaf-700">AgroClima IA</p><h2 className="mt-1 font-display text-2xl font-bold text-leaf-900">{selected ? "Detalle del análisis" : "Historial"}</h2></div>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Cerrar historial">×</button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {selected && response ? <RiskResult campo={selected.campo} response={response} climate={extractClimateSummary(selected.analisis.clima_json)} historical onNew={() => setSelected(null)} /> : <>
          <p className="mb-4 text-sm leading-6 text-slate-600">Consulta tus análisis anteriores y revisa las recomendaciones generadas.</p>
          {loading && <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600" aria-live="polite">Cargando historial…</div>}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</div>}
          {!loading && !error && !entries.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm leading-6 text-slate-600">Todavía no tienes análisis guardados. Analiza tu primera parcela para verla aquí.</div>}
          {!loading && !error && entries.length > 0 && <div className="space-y-3">{entries.map(({ campo, analisis }) => <article className={`rounded-2xl border p-4 ${riskStyle[analisis.nivel_riesgo]}`} key={analisis.id}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg font-bold">{campo.nombre}</h3><p className="mt-1 text-sm capitalize opacity-80">{campo.cultivo} · {dateLabel(analisis.created_at)}</p></div><span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">{riskLabel[analisis.nivel_riesgo]}</span></div>
            <p className="mt-3 text-sm font-semibold capitalize">{analisis.tipo_riesgo}</p>
            <button type="button" onClick={() => setSelected({ campo, analisis })} className="mt-4 w-full rounded-xl bg-white/80 px-3 py-2.5 text-sm font-bold text-leaf-800 hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/70">Ver detalle →</button>
          </article>)}</div>}
        </>}
      </div>
    </aside>
  </div>;
}
