// Valores canónicos: deben coincidir con el CHECK constraint de public.campos.
// Las etiquetas con acentos se presentan únicamente en la interfaz.
export const CULTIVOS = ["cacao", "cafe", "platano", "maiz", "arroz"] as const;
export type Cultivo = (typeof CULTIVOS)[number];
export type NivelRiesgo = "bajo" | "medio" | "alto";
export type Coordinates = { lat: number; lon: number };
export type MapSelection = { geojson: string; centroide: Coordinates };

export type Campo = {
  id: string;
  user_id: string;
  nombre: string;
  cultivo: Cultivo;
  geojson: string;
  created_at: string;
};

export type Analisis = {
  id: string;
  campo_id: string;
  clima_json: Record<string, unknown>;
  nivel_riesgo: NivelRiesgo;
  tipo_riesgo: string;
  recomendaciones: string[];
  created_at: string;
};

export type ResultadoRiesgo = {
  nivel_riesgo: NivelRiesgo;
  tipo_riesgo: string;
  recomendaciones: string[];
  justificacion?: string;
};

export type ApiAnalysisResponse = { resultado: ResultadoRiesgo; analisis: Analisis };
export type ClimaResumen = { temp_max: number | null; temp_min: number | null; prob_lluvia: number | null; humedad: number | null };
export type Imagen = { id: string; campo_id: string; storage_path: string; descripcion: string | null; created_at: string; signedUrl?: string };
export type PendingPhoto = { id: string; file: File; descripcion: string; preview: string };
