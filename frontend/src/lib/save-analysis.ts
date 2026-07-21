import type { ApiAnalysisResponse } from "../types";

/**
 * Los análisis se persisten automáticamente en la Edge Function analizarRiesgo.
 * Este helper se conserva como punto de extensión para futuras acciones sobre
 * un análisis, pero no vuelve a insertar el registro y evita duplicados.
 */
export async function guardarAnalisis(_resultado: ApiAnalysisResponse): Promise<void> {
  return Promise.resolve();
}
