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

export async function requestEmailOtp(email: string) {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw failure(error, "No se pudo enviar el código.");
}

export async function verifyEmailOtp(email: string, token: string): Promise<User> {
  const { data, error } = await client().auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) throw failure(error, "El código no es válido o venció.");
  return data.user;
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  if (error) throw failure(error, "No se pudo cerrar la sesión.");
}
