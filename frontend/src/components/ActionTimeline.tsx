import type { AccionDia } from "../types";

const styles = { bajo: "border-emerald-200 bg-emerald-50", medio: "border-amber-200 bg-amber-50", alto: "border-rose-200 bg-rose-50" };
export function ActionTimeline({ actions }: { actions: AccionDia[] }) {
  if (!actions.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="action-plan-title"><p className="text-xs font-bold uppercase tracking-widest text-leaf-700">Plan de acción</p><h3 id="action-plan-title" className="mt-1 font-display text-xl font-bold text-leaf-900">Qué hacer en los próximos 7 días</h3><div className="mt-4 space-y-3">{actions.map((item) => <article key={item.fecha} className={`rounded-xl border p-3 ${styles[item.nivel_riesgo]}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-600">{item.etiqueta}</p><p className="mt-1 font-bold text-slate-900">{item.accion}</p></div><span className="shrink-0 text-xs font-semibold text-slate-600">{item.fecha}</span></div><p className="mt-2 text-sm leading-5 text-slate-700">{item.motivo}</p></article>)}</div></section>;
}
