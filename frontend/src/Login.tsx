import { FormEvent, useEffect, useState } from "react";
import { getCurrentUser, requestVerificationEmail } from "./lib/auth";

type Props = { onAuthenticated: () => void };
type Step = "email" | "sent";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error inesperado. Inténtalo nuevamente.";

export function Login({ onAuthenticated }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    void getCurrentUser().then((user) => { if (user) onAuthenticated(); }).catch((issue) => setError(errorText(issue)));
  }, [onAuthenticated]);

  useEffect(() => {
    if (!secondsLeft) return;
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const sendVerification = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError("Ingresa un correo válido."); return; }
    setBusy(true); setError(null);
    try {
      await requestVerificationEmail(normalizedEmail);
      setEmail(normalizedEmail); setStep("sent"); setSecondsLeft(60);
    } catch (issue) { setError(errorText(issue)); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#f5f7f2] px-5 py-10 text-slate-800"><section className="w-full max-w-md rounded-3xl border border-leaf-100 bg-white p-6 shadow-[0_24px_70px_-32px_rgba(23,59,42,.38)] sm:p-8"><a href="/" className="flex items-center gap-2 font-display text-xl font-bold text-leaf-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-xl text-white">⌁</span>AgroClima <span className="text-amber-600">IA</span></a>
    {step === "email" ? <form className="mt-9" onSubmit={sendVerification}><p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">Acceso seguro</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-leaf-900">Ingresa a tu parcela.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Te enviaremos un enlace de verificación a tu correo. No necesitas contraseña.</p><label className="mt-7 block text-sm font-semibold text-slate-700">Correo electrónico<input autoComplete="email" autoFocus className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100" disabled={busy} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" type="email" value={email} /></label><FormError error={error} /><button className="mt-5 w-full rounded-xl bg-leaf-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={busy} type="submit">{busy ? "Enviando enlace…" : "Enviar enlace de verificación"} <span aria-hidden="true">→</span></button></form> : <section className="mt-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">Revisa tu correo</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-leaf-900">Abre el enlace.</h1><p className="mt-3 text-sm leading-6 text-slate-600">Enviamos un enlace de verificación a <strong className="font-semibold text-slate-700">{email}</strong>. Ábrelo en este dispositivo para entrar al programa.</p><FormError error={error} /><div className="mt-6 flex items-center justify-between text-sm"><button className="font-semibold text-leaf-700 underline disabled:text-slate-400" disabled={busy || secondsLeft > 0} onClick={() => void sendVerification()} type="button">{secondsLeft ? `Reenviar en ${secondsLeft}s` : "Reenviar enlace"}</button><button className="text-slate-500 underline" disabled={busy} onClick={() => { setStep("email"); setError(null); }} type="button">Cambiar correo</button></div></section>}
  </section></main>;
}

function FormError({ error }: { error: string | null }) {
  return error ? <p aria-live="polite" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p> : null;
}
