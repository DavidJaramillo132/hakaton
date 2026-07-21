import type { ApiAnalysisResponse, Campo, Coordinates, Imagen, PendingPhoto } from "../types";
import { supabase } from "./supabase";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

function client() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function createField(field: Pick<Campo, "nombre" | "cultivo" | "geojson">, userId: string): Promise<Campo> {
  const { data, error } = await client().from("campos").insert({ ...field, user_id: userId }).select().single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo guardar el campo.");
  return data as Campo;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

export async function uploadPhotos(campoId: string, photos: PendingPhoto[]): Promise<Imagen[]> {
  if (!photos.length) return [];
  const db = client();
  return Promise.all(photos.map(async ({ file, descripcion }) => {
    const { data, error } = await db.functions.invoke("gestionarImagen", {
      body: { action: "upload", campoId, fileName: file.name, contentType: file.type, base64: await fileToBase64(file), descripcion: descripcion || undefined },
    });
    if (error || !data?.image) throw new Error(error?.message ?? data?.error ?? "No se pudo subir una imagen.");
    return data.image as Imagen;
  }));
}

export async function analyzeField(campo: Campo, ubicacion: Coordinates): Promise<ApiAnalysisResponse> {
  if (apiBaseUrl) {
    const { data: { session } } = await client().auth.getSession();
    const response = await fetch(`${apiBaseUrl}/api/analisis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ campoId: campo.id, cultivo: campo.cultivo, centroide: ubicacion, geojson: campo.geojson }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(data?.error ?? "No se pudo obtener el análisis climático.");
    return data as ApiAnalysisResponse;
  }
  try {
    const { data, error } = await client().functions.invoke("analizarRiesgo", { body: { campoId: campo.id, ubicacion } });
    if (error || !data?.resultado || !data?.analisis) throw new Error(error?.message ?? data?.error ?? "No se pudo obtener el análisis climático.");
    return data as ApiAnalysisResponse;
  } catch (error) {
    throw new Error(message(error, "No se pudo obtener el análisis climático."));
  }
}

export async function loadHistory(): Promise<{ fields: Campo[]; analyses: Record<string, import("../types").Analisis> }> {
  const db = client();
  const [{ data: fields, error: fieldsError }, { data: rows, error: analysesError }] = await Promise.all([
    db.from("campos").select("*").order("created_at", { ascending: false }),
    db.from("analisis").select("*").order("created_at", { ascending: false }),
  ]);
  if (fieldsError) throw new Error(fieldsError.message);
  if (analysesError) throw new Error(analysesError.message);
  const analyses = (rows ?? []).reduce<Record<string, import("../types").Analisis>>((acc, analysis) => {
    if (!acc[analysis.campo_id]) acc[analysis.campo_id] = analysis as import("../types").Analisis;
    return acc;
  }, {});
  return { fields: (fields ?? []) as Campo[], analyses };
}
