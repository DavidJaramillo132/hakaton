import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key && !url.includes("your-project"));
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, key!) : null;

export async function ensureAnonymousSession(): Promise<User> {
  if (!supabase) throw new Error("Falta configurar Supabase. Revisa el archivo .env.");
  const { data: { user }, error: currentError } = await supabase.auth.getUser();
  if (user && !currentError) return user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error(error?.message ?? "No se pudo iniciar la sesión anónima.");
  return data.user;
}
