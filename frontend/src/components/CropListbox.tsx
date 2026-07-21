import { useEffect, useId, useRef, useState } from "react";
import { CULTIVOS, type Cultivo } from "../types";

type Props = { value: Cultivo | ""; onChange: (value: Cultivo) => void };
const label = (crop: Cultivo) => crop[0].toUpperCase() + crop.slice(1);

export function CropListbox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId(); const root = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div className="relative" ref={root}><span id={`${id}-label`} className="mb-2 block text-sm font-semibold text-slate-700">Cultivo <span className="text-rose-500">*</span></span><button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-label`} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-left text-sm shadow-sm outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100"><span className={value ? "text-slate-800" : "text-slate-400"}>{value ? label(value) : "Selecciona un cultivo"}</span><span className="text-leaf-700">⌄</span></button>{open && <ul role="listbox" aria-labelledby={`${id}-label`} className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">{CULTIVOS.map((crop) => <li key={crop} role="option" aria-selected={value === crop}><button type="button" onClick={() => { onChange(crop); setOpen(false); }} className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-leaf-50 ${value === crop ? "bg-leaf-50 font-semibold text-leaf-700" : "text-slate-700"}`}>{label(crop)}{value === crop && <span>✓</span>}</button></li>)}</ul>}</div>;
}
