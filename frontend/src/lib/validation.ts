import type { Cultivo, PendingPhoto } from "../types";

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
