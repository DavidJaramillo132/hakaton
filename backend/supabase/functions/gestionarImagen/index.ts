import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.0";

const BUCKET = "cultivo-imagenes";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
type Upload = { action: "upload"; campoId: string; fileName: string; contentType: string; base64: string; descripcion?: string };
type Input = Upload | { action: "list"; campoId: string } | { action: "read"; imageId: string };
class HttpError extends Error { constructor(readonly status: number, message: string) { super(message); } }
function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: HEADERS }); }
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function required(value: unknown, field: string) { if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${field} es obligatorio.`); return value.trim(); }
function parse(value: unknown): Input {
  if (!isObject(value)) throw new HttpError(400, "El cuerpo debe ser JSON.");
  const action = required(value.action, "action");
  if (action === "upload") {
    const contentType = required(value.contentType, "contentType");
    if (!TYPES.has(contentType)) throw new HttpError(400, "Solo se aceptan JPG, PNG o WebP.");
    return { action, campoId: required(value.campoId, "campoId"), fileName: required(value.fileName, "fileName"), contentType, base64: required(value.base64, "base64"), descripcion: typeof value.descripcion === "string" && value.descripcion.trim() ? value.descripcion.trim() : undefined };
  }
  if (action === "list") return { action, campoId: required(value.campoId, "campoId") };
  if (action === "read") return { action, imageId: required(value.imageId, "imageId") };
  throw new HttpError(400, "action debe ser upload, list o read.");
}
function toBytes(base64: string) {
  try {
    const raw = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
    const bytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) throw new HttpError(400, "La imagen debe ser de máximo 5 MB.");
    return bytes;
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, "La imagen base64 no es válida."); }
}
function safeName(value: string) { return value.replace(/[^a-zA-Z0-9._-]/g, "_") || "cultivo.jpg"; }
async function requireCampo(supabase: SupabaseClient, campoId: string) {
  const { data, error } = await supabase.from("campos").select("id").eq("id", campoId).maybeSingle();
  if (error) throw new HttpError(500, `No se pudo consultar el campo: ${error.message}`);
  if (!data) throw new HttpError(404, "Campo no encontrado o sin acceso.");
}
async function signedUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new HttpError(500, `No se pudo crear la URL de la foto: ${error?.message ?? "error desconocido"}`);
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: HEADERS });
  if (req.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) throw new HttpError(401, "Falta el JWT de la sesión.");
    const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) throw new HttpError(500, "Faltan variables base de Supabase.");
    const supabase = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new HttpError(401, "La sesión no es válida.");
    const input = parse(await req.json());
    if (input.action === "upload") {
      await requireCampo(supabase, input.campoId);
      const path = `${auth.user.id}/${input.campoId}/${crypto.randomUUID()}-${safeName(input.fileName)}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, toBytes(input.base64), { contentType: input.contentType, upsert: false });
      if (uploadError) throw new HttpError(500, `No se pudo subir la foto: ${uploadError.message}`);
      const { data: image, error: imageError } = await supabase.from("imagenes").insert({ campo_id: input.campoId, user_id: auth.user.id, storage_path: path, descripcion: input.descripcion ?? null }).select("id, campo_id, storage_path, descripcion, created_at").single();
      if (imageError) { await supabase.storage.from(BUCKET).remove([path]); throw new HttpError(500, `No se pudo registrar la foto: ${imageError.message}`); }
      return reply({ image: { ...image, signedUrl: await signedUrl(supabase, image.storage_path) } }, 201);
    }
    if (input.action === "list") {
      await requireCampo(supabase, input.campoId);
      const { data, error } = await supabase.from("imagenes").select("id, campo_id, storage_path, descripcion, created_at").eq("campo_id", input.campoId).order("created_at", { ascending: false });
      if (error) throw new HttpError(500, `No se pudieron leer las fotos: ${error.message}`);
      return reply({ images: await Promise.all((data ?? []).map(async (image) => ({ ...image, signedUrl: await signedUrl(supabase, image.storage_path) }))) });
    }
    const { data: image, error } = await supabase.from("imagenes").select("id, storage_path").eq("id", input.imageId).maybeSingle();
    if (error) throw new HttpError(500, `No se pudo consultar la foto: ${error.message}`);
    if (!image) throw new HttpError(404, "Foto no encontrada o sin acceso.");
    return reply({ id: image.id, signedUrl: await signedUrl(supabase, image.storage_path) });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : "Error inesperado." }, error instanceof HttpError ? error.status : 500); }
});
