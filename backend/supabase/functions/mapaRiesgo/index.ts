import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAPITALS = [
  { ciudad: "Cuenca", lat: -2.9001, lon: -79.0059 }, { ciudad: "Guaranda", lat: -1.5926, lon: -79.0009 },
  { ciudad: "Azogues", lat: -2.7400, lon: -78.8460 }, { ciudad: "Tulcán", lat: 0.8119, lon: -77.7173 },
  { ciudad: "Riobamba", lat: -1.6636, lon: -78.6546 }, { ciudad: "Latacunga", lat: -0.9352, lon: -78.6155 },
  { ciudad: "Machala", lat: -3.2581, lon: -79.9554 }, { ciudad: "Esmeraldas", lat: 0.9682, lon: -79.6517 },
  { ciudad: "Puerto Baquerizo Moreno", lat: -0.9010, lon: -89.6100 }, { ciudad: "Guayaquil", lat: -2.1709, lon: -79.9224 },
  { ciudad: "Ibarra", lat: 0.3517, lon: -78.1223 }, { ciudad: "Loja", lat: -3.9931, lon: -79.2042 },
  { ciudad: "Babahoyo", lat: -1.8022, lon: -79.5344 }, { ciudad: "Portoviejo", lat: -1.0546, lon: -80.4545 },
  { ciudad: "Macas", lat: -2.3087, lon: -78.1114 }, { ciudad: "Tena", lat: -0.9938, lon: -77.8129 },
  { ciudad: "Puerto Francisco de Orellana", lat: -0.4655, lon: -76.9870 }, { ciudad: "Puyo", lat: -1.4928, lon: -77.9981 },
  { ciudad: "Quito", lat: -0.1807, lon: -78.4678 }, { ciudad: "Santa Elena", lat: -2.2260, lon: -80.8580 },
  { ciudad: "Santo Domingo", lat: -0.2531, lon: -79.1754 }, { ciudad: "Nueva Loja", lat: 0.0860, lon: -76.8950 },
  { ciudad: "Ambato", lat: -1.2491, lon: -78.6168 }, { ciudad: "Zamora", lat: -4.0690, lon: -78.9567 },
];

type ForecastDay = {
  daily?: {
    precipitation_sum?: unknown[];
    precipitation_probability_max?: unknown[];
    relative_humidity_2m_mean?: unknown[];
    wind_speed_10m_max?: unknown[];
  };
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const numberAt = (values: unknown[] | undefined) => {
  const value = values?.[0];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

function climateRiskIndex(lluviaMm: number, probLluvia: number, humedad: number, vientoKmh: number) {
  const lluvia = Math.max(clamp(probLluvia), clamp((lluviaMm / 25) * 100));
  const humedadNormalizada = clamp(((humedad - 60) / 40) * 100);
  const vientoNormalizado = clamp(((vientoKmh - 20) / 40) * 100);
  return Math.round((lluvia * 0.45) + (humedadNormalizada * 0.35) + (vientoNormalizado * 0.2));
}

function level(index: number) {
  if (index <= 33) return "bajo";
  if (index <= 66) return "medio";
  return "alto";
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Método no permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response({ error: "Sesión requerida." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return response({ error: "La función no está configurada." }, 500);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return response({ error: "Sesión inválida." }, 401);

  try {
    const points = CAPITALS;
    const query = new URLSearchParams({
      latitude: points.map((point) => point.lat.toFixed(4)).join(","),
      longitude: points.map((point) => point.lon.toFixed(4)).join(","),
      daily: "precipitation_sum,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max",
      forecast_days: "1",
      timezone: "America/Guayaquil",
    });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
    if (!weatherResponse.ok) throw new Error(`Open-Meteo respondió ${weatherResponse.status}.`);
    const forecast = await weatherResponse.json() as ForecastDay | ForecastDay[];
    if (!Array.isArray(forecast) || forecast.length !== points.length) throw new Error("Open-Meteo devolvió datos incompletos de las capitales.");

    const riskPoints = forecast.map((day, index) => {
      const lluviaMm = numberAt(day.daily?.precipitation_sum);
      const probLluvia = numberAt(day.daily?.precipitation_probability_max);
      const humedad = numberAt(day.daily?.relative_humidity_2m_mean);
      const vientoKmh = numberAt(day.daily?.wind_speed_10m_max);
      if ([lluviaMm, probLluvia, humedad, vientoKmh].some((metric) => metric === null)) throw new Error("Open-Meteo devolvió métricas inválidas.");
      const indice = climateRiskIndex(lluviaMm, probLluvia, humedad, vientoKmh);
      return { ...points[index], indice, nivel: level(indice), lluvia_mm: lluviaMm, prob_lluvia: probLluvia, humedad, viento_kmh: vientoKmh };
    });
    return response({ generado_en: new Date().toISOString(), puntos: riskPoints });
  } catch (error) {
    console.error("mapaRiesgo", error);
    return response({ error: error instanceof Error ? error.message : "No se pudo consultar el clima territorial." }, 502);
  }
});
