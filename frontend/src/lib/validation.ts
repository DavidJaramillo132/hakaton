import type { Cultivo, PendingPhoto, SistemaRiego, TipoSuelo } from "../types";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validateField(input: { nombre: string; cultivo: Cultivo | ""; geojson: string | null }): string | null {
  if (!input.geojson) return "Dibuja el área de tu cultivo en el mapa.";
  if (input.nombre.trim().length < 2) return "Escribe un nombre de al menos 2 caracteres para el campo.";
  if (!input.cultivo) return "Selecciona el cultivo que vas a analizar.";
  return null;
}

export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.has(file.type)) return "Solo se permiten imágenes JPG, PNG o WebP.";
  if (file.size > MAX_PHOTO_BYTES) return "Cada imagen debe pesar como máximo 5 MB.";
  return null;
}

export function validatePhotos(photos: PendingPhoto[]): string | null {
  return photos.map(({ file }) => validatePhoto(file)).find(Boolean) ?? null;
}

export function validateAgriculturalDetails(input: { fecha_siembra: string; edad_cultivo_meses: string; sistema_riego: SistemaRiego | ""; tipo_suelo: TipoSuelo | ""; ultima_aplicacion_fertilizante: string; variedad_cultivo: string }): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (input.fecha_siembra && input.fecha_siembra > today) return "La fecha de siembra no puede ser futura.";
  if (input.ultima_aplicacion_fertilizante && input.ultima_aplicacion_fertilizante > today) return "La fecha de fertilización no puede ser futura.";
  if (input.fecha_siembra && input.ultima_aplicacion_fertilizante && input.ultima_aplicacion_fertilizante < input.fecha_siembra) return "La fertilización debe ser posterior a la siembra.";
  if (input.edad_cultivo_meses && (!/^\d+$/.test(input.edad_cultivo_meses) || Number(input.edad_cultivo_meses) > 1200)) return "La edad del cultivo debe ser un número de meses válido.";
  return null;
}
