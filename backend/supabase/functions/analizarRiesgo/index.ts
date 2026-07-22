import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const RISK_LEVELS = new Set(["bajo", "medio", "alto"]);
const OPENAI_TIMEOUT_MS = 25_000;
type Json = Record<string, unknown>;
type Nivel = "bajo" | "medio" | "alto";
type Accion = { fecha: string; etiqueta: string; accion: string; motivo: string; nivel_riesgo: Nivel };
type Risk = { nivel_riesgo: Nivel; tipo_riesgo: string; recomendaciones: string[]; justificacion: string; plan_7_dias: Accion[] };
class HttpError extends Error { constructor(readonly status: number, message: string) { super(message); } }

function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: CORS }); }
function isObject(value: unknown): value is Json { return typeof value === "object" && value !== null && !Array.isArray(value); }
function parseRequest(value: unknown) {
  if (!isObject(value) || typeof value.campoId !== "string" || !value.campoId.trim()) throw new HttpError(400, "campoId es obligatorio.");
  if (!isObject(value.ubicacion) || typeof value.ubicacion.lat !== "number" || typeof value.ubicacion.lon !== "number") throw new HttpError(400, "ubicacion debe incluir lat y lon numéricos.");
  const { lat, lon } = value.ubicacion;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new HttpError(400, "ubicacion está fuera de rango.");
  return { campoId: value.campoId.trim(), ubicacion: { lat, lon } };
}
function fallbackPlan(clima: Json): Accion[] {
  const daily = isObject(clima.daily) ? clima.daily : {};
  const values = (key: string) => Array.isArray(daily[key]) ? daily[key] : [];
  const dates = values("time");
  return dates.slice(0, 7).map((date, index) => {
    const lluvia = Number(values("precipitation_probability_max")[index] ?? 0); const humedad = Number(values("relative_humidity_2m_mean")[index] ?? 0); const viento = Number(values("wind_speed_10m_max")[index] ?? 0);
    const score = Math.round((Math.max(lluvia, 0) * .4) + (Math.max(0, humedad - 60) * .35) + (Math.max(0, viento - 20) * .2)); const nivel: Nivel = score >= 65 ? "alto" : score >= 35 ? "medio" : "bajo";
    const accion = lluvia >= 70 ? "Revisar drenaje y evitar labores con suelo saturado" : humedad >= 80 ? "Inspeccionar hojas y mantener ventilación" : viento >= 35 ? "Asegurar tutores y evitar aplicaciones" : nivel === "bajo" ? "Ventana ideal para labores del cultivo" : "Monitorear el cultivo y ajustar labores";
    const motivo = lluvia >= 70 ? "La probabilidad de lluvia elevada puede saturar el suelo." : humedad >= 80 ? "La humedad alta favorece condiciones de presión sanitaria." : viento >= 35 ? "El viento puede dispersar aplicaciones y dañar plantas." : "Las condiciones previstas permiten labores preventivas.";
    const dateText = typeof date === "string" ? date : new Date().toISOString().slice(0, 10); const etiqueta = index === 0 ? "Hoy" : index === 1 ? "Mañana" : new Intl.DateTimeFormat("es-EC", { weekday: "long", timeZone: "America/Guayaquil" }).format(new Date(`${dateText}T12:00:00`));
    return { fecha: dateText, etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1), accion, motivo, nivel_riesgo: nivel };
  });
}
function validRisk(value: unknown): value is Risk {
  if (!isObject(value) || !RISK_LEVELS.has(value.nivel_riesgo as string)) return false;
  return typeof value.tipo_riesgo === "string" && value.tipo_riesgo.trim().length > 0 && Array.isArray(value.recomendaciones) && value.recomendaciones.length >= 3 && value.recomendaciones.length <= 5 && value.recomendaciones.every((x) => typeof x === "string" && x.trim().length > 0) && typeof value.justificacion === "string" && value.justificacion.trim().length > 0 && Array.isArray(value.plan_7_dias) && value.plan_7_dias.length >= 1 && value.plan_7_dias.length <= 7;
}
function outputText(payload: unknown): string | null {
  if (!isObject(payload)) return null;
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  if (!Array.isArray(payload.output)) return null;
  const text = payload.output.flatMap((item) => {
    if (!isObject(item) || !Array.isArray(item.content)) return [];
    return item.content.flatMap((content) => isObject(content) && content.type === "output_text" && typeof content.text === "string" ? [content.text] : []);
  }).join("");
  return text.trim() ? text : null;
}
async function forecast(lat: number, lon: number): Promise<Json> {
  const query = new URLSearchParams({ latitude: String(lat), longitude: String(lon), timezone: "America/Guayaquil", forecast_days: "7", daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean" });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !isObject(data)) throw new HttpError(502, "No se pudo obtener el pronóstico de Open-Meteo.");
  return data;
}
async function analyze(cultivo: string, ubicacion: { lat: number; lon: number }, clima: Json, datosAgricolas: Json): Promise<Risk> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) throw new HttpError(500, "Faltan los secretos OPENAI_API_KEY u OPENAI_MODEL.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, store: false,
        input: [
          { role: "system", content: "Eres un agrónomo experto en Manabí, Ecuador. Con el pronóstico disponible, entrega recomendaciones preventivas, concretas y accionables. No diagnostiques plagas ni afirmes certeza. Relaciona humedad alta con moniliasis en cacao, roya en café y sigatoka negra en plátano; y falta de lluvia con estrés hídrico en maíz y arroz. La decisión final corresponde al productor." },
          { role: "user", content: JSON.stringify({ cultivo, ubicacion, datosAgricolas, clima }) },
        ],
        text: { format: { type: "json_schema", name: "analisis_riesgo_agricola", strict: true, schema: { type: "object", additionalProperties: false, required: ["nivel_riesgo", "tipo_riesgo", "recomendaciones", "justificacion", "plan_7_dias"], properties: { nivel_riesgo: { type: "string", enum: ["bajo", "medio", "alto"] }, tipo_riesgo: { type: "string" }, recomendaciones: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } }, justificacion: { type: "string" }, plan_7_dias: { type: "array", minItems: 1, maxItems: 7, items: { type: "object", additionalProperties: false, required: ["fecha", "etiqueta", "accion", "motivo", "nivel_riesgo"], properties: { fecha: { type: "string" }, etiqueta: { type: "string" }, accion: { type: "string" }, motivo: { type: "string" }, nivel_riesgo: { type: "string", enum: ["bajo", "medio", "alto"] } } } } } } } },
      }), signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new HttpError(502, `OpenAI no pudo analizar el riesgo: ${payload?.error?.message ?? response.status}.`);
    const text = outputText(payload);
    const result = text ? JSON.parse(text) : null;
    if (!isObject(result) || !RISK_LEVELS.has(result.nivel_riesgo as string) || typeof result.tipo_riesgo !== "string" || !Array.isArray(result.recomendaciones) || result.recomendaciones.length < 3 || result.recomendaciones.length > 5 || !result.recomendaciones.every((item) => typeof item === "string" && item.trim()) || typeof result.justificacion !== "string" || !result.justificacion.trim()) throw new HttpError(502, "OpenAI devolvió una respuesta con formato inválido.");
    const plan = Array.isArray(result.plan_7_dias) && result.plan_7_dias.length >= 1 && result.plan_7_dias.length <= 7 ? result.plan_7_dias as Accion[] : fallbackPlan(clima);
    return { nivel_riesgo: result.nivel_riesgo as Nivel, tipo_riesgo: result.tipo_riesgo, recomendaciones: result.recomendaciones as string[], justificacion: result.justificacion, plan_7_dias: plan };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new HttpError(504, "OpenAI excedió el tiempo máximo de espera.");
    if (error instanceof SyntaxError) throw new HttpError(502, "OpenAI devolvió JSON inválido.");
    throw new HttpError(502, "No se pudo conectar con OpenAI.");
  } finally { clearTimeout(timer); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) throw new HttpError(401, "Falta el JWT de la sesión.");
    const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) throw new HttpError(500, "Faltan variables base de Supabase.");
    const input = parseRequest(await req.json());
    const supabase = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new HttpError(401, "La sesión no es válida.");
    const { data: campo, error: campoError } = await supabase.from("campos").select("*").eq("id", input.campoId).maybeSingle();
    if (campoError) throw new HttpError(500, `No se pudo consultar el campo: ${campoError.message}`);
    if (!campo) throw new HttpError(404, "Campo no encontrado o sin acceso.");
    const clima = await forecast(input.ubicacion.lat, input.ubicacion.lon);
    let resultado: Risk;
    try { resultado = await analyze(campo.cultivo, input.ubicacion, clima, campo); } catch (error) { console.error("analizarRiesgo AI", error); throw error; }
    const { data: analisis, error: saveError } = await supabase.from("analisis").insert({ campo_id: campo.id, clima_json: clima, nivel_riesgo: resultado.nivel_riesgo, tipo_riesgo: resultado.tipo_riesgo, recomendaciones: resultado.recomendaciones, plan_7_dias: resultado.plan_7_dias.length ? resultado.plan_7_dias : fallbackPlan(clima) }).select().single();
    if (saveError) throw new HttpError(500, `No se pudo guardar el análisis: ${saveError.message}`);
    return reply({ resultado, analisis }, 201);
  } catch (error) { return reply({ error: error instanceof Error ? error.message : "Error inesperado." }, error instanceof HttpError ? error.status : 500); }
});
