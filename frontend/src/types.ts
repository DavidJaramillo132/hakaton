// Valores canónicos: deben coincidir con el CHECK constraint de public.campos.
// Las etiquetas con acentos se presentan únicamente en la interfaz.
export const CULTIVOS = ["cacao", "cafe", "platano", "maiz", "arroz"] as const;
export type Cultivo = (typeof CULTIVOS)[number];
export type NivelRiesgo = "bajo" | "medio" | "alto";
export const SISTEMAS_RIEGO = ["ninguno", "goteo", "aspersión", "gravedad", "otro"] as const;
export type SistemaRiego = (typeof SISTEMAS_RIEGO)[number];
export const TIPOS_SUELO = ["arcilloso", "arenoso", "franco", "limoso", "otro"] as const;
export type TipoSuelo = (typeof TIPOS_SUELO)[number];
export type Coordinates = { lat: number; lon: number };
export type MapSelection = { geojson: string; centroide: Coordinates };

export type Campo = {
  id: string;
  user_id: string;
  nombre: string;
  cultivo: Cultivo;
  geojson: string;
  created_at: string;
  fecha_siembra?: string | null;
  edad_cultivo_meses?: number | null;
  sistema_riego?: SistemaRiego | null;
  tipo_suelo?: TipoSuelo | null;
  ultima_aplicacion_fertilizante?: string | null;
  variedad_cultivo?: string | null;
};

export type Analisis = {
  id: string;
  campo_id: string;
  clima_json: Record<string, unknown>;
  nivel_riesgo: NivelRiesgo;
  tipo_riesgo: string;
  recomendaciones: string[];
  plan_7_dias?: AccionDia[] | null;
  created_at: string;
};

export type AccionDia = { fecha: string; etiqueta: string; accion: string; motivo: string; nivel_riesgo: NivelRiesgo };

export type ResultadoRiesgo = {
  nivel_riesgo: NivelRiesgo;
  tipo_riesgo: string;
  recomendaciones: string[];
  justificacion?: string;
  plan_7_dias?: AccionDia[];
};

export type ApiAnalysisResponse = { resultado: ResultadoRiesgo; analisis: Analisis };
export type HistoryData = { fields: Campo[]; analyses: Analisis[]; images: Imagen[] };
export type ClimaResumen = { temp_max: number | null; temp_min: number | null; prob_lluvia: number | null; humedad: number | null };
export type IndiceRiesgoDiario = { puntuacion: number; nivel: NivelRiesgo };
export type PronosticoDia = {
  fecha: string;
  etiqueta: string;
  tempMax: number | null;
  tempMin: number | null;
  lluvia: number | null;
  humedad: number | null;
  viento: number | null;
  riesgo: IndiceRiesgoDiario | null;
};
export type SimulacionAjustes = { lluvia: number; temperatura: number; humedad: number; viento: number };
export type Imagen = { id: string; campo_id: string; storage_path: string; descripcion: string | null; created_at: string; signedUrl?: string };
export type PendingPhoto = { id: string; file: File; descripcion: string; preview: string };
export type HeatmapRiskLevel = "bajo" | "medio" | "alto";
export type HeatmapPoint = { ciudad: string; lat: number; lon: number; indice: number; nivel: HeatmapRiskLevel; lluvia_mm: number; prob_lluvia: number; humedad: number; viento_kmh: number };
export type HeatmapResponse = { generado_en: string; puntos: HeatmapPoint[] };
