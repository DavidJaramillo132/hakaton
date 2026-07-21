type Props = { ready: boolean; onStart: () => void };

export function DrawAreaButton({ ready, onStart }: Props) {
  return <div className="absolute left-14 top-4 z-[500] max-w-56 rounded-xl bg-white/95 p-2 shadow-lg">
    <button type="button" onClick={onStart} disabled={!ready} className="w-full rounded-lg bg-leaf-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-leaf-700 disabled:cursor-wait disabled:bg-slate-400">⌖ Dibujar área</button>
    <p className="mt-1.5 px-1 text-[11px] leading-4 text-slate-600">Marca cada esquina y toca el primer punto para cerrar el área.</p>
  </div>;
}
