type Props = {
  active: boolean;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
};

export function LocationControl({ active, loading, error, onToggle }: Props) {
  return <div className="absolute right-4 top-16 z-[500] space-y-2">
    <button aria-pressed={active} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-leaf-900 shadow-lg transition hover:bg-leaf-50 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} onClick={onToggle} type="button">
      {loading ? "Buscando ubicación…" : active ? "Detener ubicación" : "Mi ubicación"}
    </button>
    {error && <div role="alert" className="max-w-60 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 shadow-lg">
      {error}<button className="ml-2 font-bold underline" onClick={onToggle} type="button">Reintentar</button>
    </div>}
  </div>;
}
