import type { ApiAnalysisResponse } from "../types";

/** Punto de extensión para una futura confirmación manual en Supabase. */
export async function guardarAnalisis(_resultado: ApiAnalysisResponse): Promise<void> {
  await Promise.resolve();
}
