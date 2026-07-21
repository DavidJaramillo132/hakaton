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

function redirectToApp() {
  return `${window.location.origin}/app`;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error("Correo o contraseña incorrectos.");
  return data.user;
}

export async function signUp(email: string, password: string) {
  const { error } = await client().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectToApp() },
  });
  if (error) throw failure(error, "No se pudo crear la cuenta. Inténtalo nuevamente.");
}

export async function requestMagicLink(email: string) {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectToApp() },
  });
  if (error) throw failure(error, "No se pudo enviar el enlace de acceso.");
}

export async function signOut() {
  const { error } = await client().auth.signOut();
  if (error) throw failure(error, "No se pudo cerrar la sesión.");
}
