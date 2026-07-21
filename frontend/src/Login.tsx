import { FormEvent, useEffect, useState } from "react";
import { getCurrentUser, requestMagicLink, signInWithPassword, signUp } from "./lib/auth";

type Props = { onAuthenticated: () => void };
type Mode = "sign-in" | "sign-up" | "legacy";
type Step = "form" | "confirmation" | "magic-sent";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error inesperado. Inténtalo nuevamente.";

export function Login({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => { void getCurrentUser().then((user) => { if (user) onAuthenticated(); }).catch((issue) => setError(errorText(issue))); }, [onAuthenticated]);
  useEffect(() => { if (!secondsLeft) return; const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000); return () => window.clearInterval(timer); }, [secondsLeft]);

  const normalizedEmail = () => email.trim().toLowerCase();
  const changeMode = (next: Mode) => { setMode(next); setStep("form"); setError(null); setPassword(""); setConfirmation(""); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizedEmail();
    if (!normalized) { setError("Ingresa un correo válido."); return; }
    if (mode !== "legacy" && !password) { setError("Ingresa tu contraseña."); return; }
    if (mode === "sign-up" && password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true); setError(null);
    try {
      if (mode === "sign-in") { await signInWithPassword(normalized, password); onAuthenticated(); return; }
      if (mode === "sign-up") { await signUp(normalized, password); setEmail(normalized); setStep("confirmation"); return; }
      await requestMagicLink(normalized); setEmail(normalized); setStep("magic-sent"); setSecondsLeft(60);
    } catch (issue) { setError(mode === "sign-in" ? "Correo o contraseña incorrectos." : errorText(issue)); }
    finally { setBusy(false); }
  };
  const resendMagicLink = async () => {
    if (secondsLeft) return;
    setBusy(true); setError(null);
    try { await requestMagicLink(email); setSecondsLeft(60); }
    catch (issue) { setError(errorText(issue)); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#f5f7f2] px-5 py-10 text-slate-800"><section className="w-full max-w-md rounded-3xl border border-leaf-100 bg-white p-6 shadow-[0_24px_70px_-32px_rgba(23,59,42,.38)] sm:p-8"><a href="/" className="flex items-center gap-2 font-display text-xl font-bold text-leaf-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-xl text-white">⌁</span>AgroClima <span className="text-amber-600">IA</span></a>
    {step === "form" ? <><div className="mt-8 flex rounded-xl bg-leaf-50 p-1" role="tablist" aria-label="Tipo de acceso"><ModeTab active={mode === "sign-in"} onClick={() => changeMode("sign-in")}>Ingresar</ModeTab><ModeTab active={mode === "sign-up"} onClick={() => changeMode("sign-up")}>Crear cuenta</ModeTab></div><form className="mt-7" onSubmit={submit}><p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">Acceso seguro</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-leaf-900">{mode === "sign-in" ? "Ingresa a tu parcela." : mode === "sign-up" ? "Crea tu cuenta." : "Acceso para cuentas antiguas."}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{mode === "sign-in" ? "Usa tu correo y contraseña para ingresar directamente." : mode === "sign-up" ? "Confirma tu correo antes de tu primer ingreso." : "Solicita un enlace si tu cuenta se creó antes de usar contraseñas."}</p><label className="mt-7 block text-sm font-semibold text-slate-700">Correo electrónico<input autoComplete="email" autoFocus className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100" disabled={busy} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" type="email" value={email} /></label>{mode !== "legacy" && <label className="mt-4 block text-sm font-semibold text-slate-700">Contraseña<input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100" disabled={busy} onChange={(event) => setPassword(event.target.value)} type="password" value={password} /></label>}{mode === "sign-up" && <label className="mt-4 block text-sm font-semibold text-slate-700">Confirmar contraseña<input autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100" disabled={busy} onChange={(event) => setConfirmation(event.target.value)} type="password" value={confirmation} /></label>}<FormError error={error} /><button className="mt-5 w-full rounded-xl bg-leaf-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={busy} type="submit">{busy ? "Procesando…" : mode === "sign-in" ? "Ingresar" : mode === "sign-up" ? "Crear cuenta" : "Enviar enlace de acceso"} <span aria-hidden="true">→</span></button></form><button className="mt-6 w-full text-sm font-semibold text-leaf-700 underline" onClick={() => changeMode("legacy")} type="button">¿Tu cuenta no tiene contraseña? Ingresa con enlace</button></> : <section className="mt-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-leaf-700">Revisa tu correo</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-leaf-900">{step === "confirmation" ? "Confirma tu cuenta." : "Abre el enlace."}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{step === "confirmation" ? <>Enviamos un enlace de confirmación a <strong className="font-semibold text-slate-700">{email}</strong>. Ábrelo para activar tu cuenta y entrar.</> : <>Enviamos un enlace de acceso a <strong className="font-semibold text-slate-700">{email}</strong>. Ábrelo en este dispositivo para entrar.</>}</p><FormError error={error} /><div className="mt-6 flex items-center justify-between text-sm">{step === "magic-sent" && <button className="font-semibold text-leaf-700 underline disabled:text-slate-400" disabled={busy || secondsLeft > 0} onClick={() => void resendMagicLink()} type="button">{secondsLeft ? `Reenviar en ${secondsLeft}s` : "Reenviar enlace"}</button>}<button className={`${step === "confirmation" ? "ml-auto" : ""} text-slate-500 underline`} disabled={busy} onClick={() => changeMode(step === "confirmation" ? "sign-in" : "legacy")} type="button">Volver</button></div></section>}
  </section></main>;
}

function ModeTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button aria-selected={active} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${active ? "bg-white text-leaf-700 shadow-sm" : "text-slate-500 hover:text-leaf-700"}`} onClick={onClick} role="tab" type="button">{children}</button>; }
function FormError({ error }: { error: string | null }) { return error ? <p aria-live="polite" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p> : null; }
