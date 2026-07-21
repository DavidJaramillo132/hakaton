import { useEffect, useMemo, useState } from "react";
import { loadHistory } from "../lib/api";
import { extractClimateSummary } from "../lib/climate";
import type { Analisis, ApiAnalysisResponse, Campo, HistoryData, Imagen } from "../types";
import { RiskResult } from "./RiskResult";

type Props = { open: boolean; onClose: () => void; refreshToken?: number };
type Entry = { campo: Campo; analisis: Analisis; images: Imagen[] };
const riskStyle = { bajo: "border-emerald-200 bg-emerald-50 text-emerald-900", medio: "border-amber-200 bg-amber-50 text-amber-950", alto: "border-rose-200 bg-rose-50 text-rose-950" };
const riskLabel = { bajo: "Riesgo bajo", medio: "Riesgo medio", alto: "Riesgo alto" };

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function entriesFrom(data: HistoryData): Entry[] {
  const fields = new Map(data.fields.map((field) => [field.id, field]));
  const imagesByField = new Map<string, Imagen[]>();
  data.images.forEach((image) => imagesByField.set(image.campo_id, [...(imagesByField.get(image.campo_id) ?? []), image]));
  return data.analyses.flatMap((analisis) => {
    const campo = fields.get(analisis.campo_id);
    return campo ? [{ campo, analisis, images: imagesByField.get(campo.id) ?? [] }] : [];
  });
}

function PhotoThumbnail({ image, alt, className = "" }: { image: Imagen; alt: string; className?: string }) {
  const [failed, setFailed] = useState(!image.signedUrl);
  if (failed) return <div className={`grid place-items-center bg-slate-100 px-2 text-center text-[11px] text-slate-500 ${className}`}>Foto no disponible</div>;
  return <img src={image.signedUrl} alt={alt} className={className} onError={() => setFailed(true)} />;
}

function PhotoGallery({ images, onOpen }: { images: Imagen[]; onOpen: (index: number) => void }) {
  if (!images.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="photos-history-title">
    <div className="flex items-baseline justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Evidencia</p><h3 id="photos-history-title" className="mt-1 font-display text-xl font-bold text-leaf-900">Fotos del cultivo</h3></div><span className="text-xs font-semibold text-slate-500">{images.length} {images.length === 1 ? "foto" : "fotos"}</span></div>
    <div className="mt-4 grid grid-cols-2 gap-3">{images.map((image, index) => <button key={image.id} type="button" onClick={() => onOpen(index)} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left focus:outline-none focus:ring-4 focus:ring-leaf-200" aria-label={`Ampliar foto ${index + 1} de ${images.length}`}><PhotoThumbnail image={image} alt={`Foto ${index + 1} del cultivo`} className="aspect-square w-full object-cover transition group-hover:scale-[1.02]" /><span className="block truncate px-2.5 py-2 text-xs font-medium text-slate-600">{image.descripcion || `Foto ${index + 1}`}</span></button>)}</div>
  </section>;
}

function PhotoLightbox({ images, index, onClose, onMove }: { images: Imagen[]; index: number; onClose: () => void; onMove: (index: number) => void }) {
  const image = images[index];
  if (!image) return null;
  const canMove = images.length > 1;
  return <div className="absolute inset-0 z-20 flex flex-col bg-slate-950/95 p-4 text-white" role="dialog" aria-modal="true" aria-label={`Foto ${index + 1} de ${images.length}`}>
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Foto {index + 1} de {images.length}</p><button type="button" onClick={onClose} className="rounded-lg bg-white/15 px-3 py-2 text-sm font-bold hover:bg-white/25" aria-label="Cerrar foto ampliada">Cerrar ×</button></div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center py-4"><PhotoThumbnail image={image} alt={`Foto ampliada ${index + 1} del cultivo`} className="max-h-full max-w-full rounded-xl object-contain" />{canMove && <><button type="button" onClick={() => onMove((index - 1 + images.length) % images.length)} className="absolute left-0 rounded-full bg-slate-950/70 px-3 py-2 text-xl font-bold hover:bg-slate-950" aria-label="Ver foto anterior">‹</button><button type="button" onClick={() => onMove((index + 1) % images.length)} className="absolute right-0 rounded-full bg-slate-950/70 px-3 py-2 text-xl font-bold hover:bg-slate-950" aria-label="Ver foto siguiente">›</button></>}</div>
    {image.descripcion && <p className="text-center text-sm text-white/80">{image.descripcion}</p>}
  </div>;
}

export function HistoryDrawer({ open, onClose, refreshToken = 0 }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setSelected(null); setPhotoIndex(null); setLoading(true); setError(null);
    void loadHistory().then((data) => { if (active) setEntries(entriesFrom(data)); }).catch((issue) => {
      if (active) setError(issue instanceof Error ? issue.message : "No se pudo cargar el historial.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, refreshToken]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (photoIndex !== null) setPhotoIndex(null);
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, photoIndex]);

  const response = useMemo<ApiAnalysisResponse | null>(() => {
    if (!selected) return null;
    return { resultado: { nivel_riesgo: selected.analisis.nivel_riesgo, tipo_riesgo: selected.analisis.tipo_riesgo, recomendaciones: selected.analisis.recomendaciones }, analisis: selected.analisis };
  }, [selected]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label="Historial de análisis">
    <button type="button" aria-label="Cerrar historial" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/35" onClick={onClose} />
    <aside className="absolute right-0 top-0 flex h-full w-[min(440px,calc(100%-1rem))] flex-col overflow-hidden bg-[#f5f7f2] shadow-2xl motion-safe:animate-[slide-in-right_.2s_ease-out]" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-leaf-100 bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-widest text-leaf-700">AgroClima IA</p><h2 className="mt-1 font-display text-2xl font-bold text-leaf-900">{selected ? "Detalle del análisis" : "Historial"}</h2></div><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Cerrar historial">×</button></header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">{selected && response ? <div className="space-y-4"><RiskResult campo={selected.campo} response={response} climate={extractClimateSummary(selected.analisis.clima_json)} historical onNew={() => { setSelected(null); setPhotoIndex(null); }} /><PhotoGallery images={selected.images} onOpen={setPhotoIndex} /></div> : <>
        <p className="mb-4 text-sm leading-6 text-slate-600">Consulta tus análisis anteriores y revisa las recomendaciones generadas.</p>
        {loading && <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600" aria-live="polite">Cargando historial…</div>}
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</div>}
        {!loading && !error && !entries.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm leading-6 text-slate-600">Todavía no tienes análisis guardados. Analiza tu primera parcela para verla aquí.</div>}
        {!loading && !error && entries.length > 0 && <div className="space-y-3">{entries.map((entry) => <article className={`rounded-2xl border p-4 ${riskStyle[entry.analisis.nivel_riesgo]}`} key={entry.analisis.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg font-bold">{entry.campo.nombre}</h3><p className="mt-1 text-sm capitalize opacity-80">{entry.campo.cultivo} · {dateLabel(entry.analisis.created_at)}</p></div><span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">{riskLabel[entry.analisis.nivel_riesgo]}</span></div><p className="mt-3 text-sm font-semibold capitalize">{entry.analisis.tipo_riesgo}</p>{entry.images.length > 0 && <div className="mt-3 flex items-center gap-3"><PhotoThumbnail image={entry.images[0]} alt={`Vista previa de ${entry.campo.nombre}`} className="h-12 w-12 rounded-lg object-cover" /><span className="text-xs font-semibold">{entry.images.length} {entry.images.length === 1 ? "foto adjunta" : "fotos adjuntas"}</span></div>}<button type="button" onClick={() => setSelected(entry)} className="mt-4 w-full rounded-xl bg-white/80 px-3 py-2.5 text-sm font-bold text-leaf-800 hover:bg-white focus:outline-none focus:ring-4 focus:ring-white/70">Ver detalle →</button></article>)}</div>}
      </>}</div>
      {selected && photoIndex !== null && <PhotoLightbox images={selected.images} index={photoIndex} onClose={() => setPhotoIndex(null)} onMove={setPhotoIndex} />}
    </aside>
  </div>;
}
