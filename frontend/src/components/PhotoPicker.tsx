import { useId, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { PendingPhoto } from "../types";
import { validatePhoto } from "../lib/validation";

type Props = { photos: PendingPhoto[]; onChange: (photos: PendingPhoto[]) => void; onError: (message: string | null) => void };

export function PhotoPicker({ photos, onChange, onError }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const addFiles = (files: File[]) => {
    const problem = files.map(validatePhoto).find(Boolean);
    if (problem) { onError(problem); return; }
    onError(null);
    onChange([...photos, ...files.map((file) => ({ id: crypto.randomUUID(), file, descripcion: "", preview: URL.createObjectURL(file) }))]);
  };
  const select = (event: ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; };
  const drop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); };
  const remove = (id: string) => { const photo = photos.find((item) => item.id === id); if (photo) URL.revokeObjectURL(photo.preview); onChange(photos.filter((item) => item.id !== id)); };
  return <section aria-labelledby="photos-title">
    <div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-leaf-700">Evidencia opcional</p><h3 id="photos-title" className="mt-1 font-display text-lg font-bold text-leaf-900">Fotos del cultivo</h3></div><span className="text-xs text-slate-500">JPG, PNG o WebP · 5 MB</span></div>
    <label htmlFor={inputId} onDragEnter={() => setDragging(true)} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition ${dragging ? "border-leaf-600 bg-leaf-50" : "border-slate-200 bg-slate-50 hover:border-leaf-600 hover:bg-leaf-50"}`}>
      <span className="text-2xl text-leaf-700">⇧</span><span className="mt-1 text-sm font-semibold text-leaf-900">Arrastra fotos o haz clic para subir</span><span className="mt-1 text-xs text-slate-500">Puedes seleccionar varias imágenes.</span>
    </label>
    <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={select} />
    {photos.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{photos.map((photo) => <figure className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white" key={photo.id}><img className="aspect-square w-full object-cover" src={photo.preview} alt={`Vista previa de ${photo.file.name}`} /><button type="button" onClick={() => remove(photo.id)} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-slate-900/75 text-sm text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Eliminar ${photo.file.name}`}>×</button><figcaption className="truncate px-1.5 py-1 text-[10px] text-slate-500">{photo.file.name}</figcaption></figure>)}</div>}
  </section>;
}
