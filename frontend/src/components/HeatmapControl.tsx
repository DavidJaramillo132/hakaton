type Props = {
  visible: boolean;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
};

export function HeatmapControl({ visible, loading, error, onToggle }: Props) {
  return <>
    <div className="absolute right-4 top-4 z-[500] space-y-2">
      <button aria-pressed={visible} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-leaf-900 shadow-lg transition hover:bg-leaf-50 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} onClick={onToggle} type="button">
        {loading ? "Cargando riesgo…" : visible ? "Ocultar mapa de riesgo" : "Ver mapa de riesgo"}
      </button>
      {error && <div role="alert" className="max-w-60 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 shadow-lg">
        {error}<button className="ml-2 font-bold underline" onClick={onToggle} type="button">Reintentar</button>
      </div>}
    </div>
    {visible && <div className="pointer-events-none absolute bottom-10 right-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg">
      <p className="font-bold text-leaf-900">Riesgo climático territorial</p>
      <div className="mt-1 flex gap-2"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Bajo</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Medio</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Alto</span></div>
      <p className="mt-1 text-[10px] text-slate-500">Toca una ciudad para ver el detalle.</p>
    </div>}
  </>;
}
