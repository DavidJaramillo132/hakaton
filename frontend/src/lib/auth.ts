import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

function client() {
  if (!supabase) throw new Error("Falta configurar Supabase. Revisa el archivo .env.");
  return supabase;
}

function failure(error: { message: string } | null, fallback: string) {
  return new Error(error?.message ?? fallback);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await client().auth.getUser();
  return error ? null : user;
}

export async function requestVerificationEmail(email: string) {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/app` },
  });
  if (error) throw failure(error, "No se pudo enviar el correo de verificación.");
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  if (error) throw failure(error, "No se pudo cerrar la sesión.");
}
