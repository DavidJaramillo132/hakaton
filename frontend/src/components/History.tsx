import type { Analisis, Campo } from "../types";

type Props = { fields: Campo[]; analyses: Record<string, Analisis>; loading: boolean; onOpen: (field: Campo, analysis: Analisis) => void; onRefresh: () => void };

export function History({ fields, analyses, loading, onOpen, onRefresh }: Props) {
  return <aside className="history" aria-label="Historial de campos">
    <div className="history-title"><div><p className="eyebrow">Tus registros</p><h2>Historial</h2></div><button className="icon-button" onClick={onRefresh} aria-label="Actualizar historial" disabled={loading}>↻</button></div>
    {loading ? <p className="muted">Cargando tus campos…</p> : fields.length === 0 ? <div className="empty-history"><span>⌁</span><p>Aquí aparecerán los campos que analices.</p></div> : <ul className="history-list">{fields.map((field) => {
      const analysis = analyses[field.id];
      return <li key={field.id}><button className="history-item" onClick={() => analysis && onOpen(field, analysis)} disabled={!analysis}><span className={`history-dot ${analysis ? `risk-${analysis.nivel_riesgo}` : "pending"}`} /><span><strong>{field.nombre}</strong><small>{field.cultivo} · {analysis ? analysis.tipo_riesgo : "sin análisis"}</small></span><span className="history-arrow">›</span></button></li>;
    })}</ul>}
  </aside>;
}
