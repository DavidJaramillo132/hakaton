import { useCallback, useEffect, useState } from "react";

import type { User } from "@supabase/supabase-js";
import { Landing } from "./Landing";
import { Login } from "./Login";
import { Program } from "./Program";
import { getCurrentUser } from "./lib/auth";

type Route = "/" | "/login" | "/app";



function currentRoute(): Route {
  return window.location.pathname === "/login" || window.location.pathname === "/app" ? window.location.pathname : "/";
}

export function App() {
  const [route, setRoute] = useState<Route>(currentRoute);
  const navigate = useCallback((nextRoute: Route, replace = false) => {
    window.history[replace ? "replaceState" : "pushState"]({}, "", nextRoute);
    setRoute(nextRoute);
  }, []);

  useEffect(() => {
    const updateRoute = () => setRoute(currentRoute());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  if (route === "/login") return <Login onAuthenticated={() => navigate("/app", true)} />;
  if (route === "/app") return <ProtectedProgram onUnauthenticated={() => navigate("/login", true)} onSignOut={() => navigate("/", true)} />;
  return <Landing />;
}

function ProtectedProgram({ onUnauthenticated, onSignOut }: { onUnauthenticated: () => void; onSignOut: () => void }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser().then((activeUser) => {
      if (activeUser) setUser(activeUser);
      else onUnauthenticated();
    }).catch((issue) => setError(issue instanceof Error ? issue.message : "No se pudo comprobar la sesión."));
  }, [onUnauthenticated]);

  if (error) return <AuthUnavailable message={error} />;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#f5f7f2] text-sm font-medium text-leaf-700">Comprobando tu sesión…</main>;
  return <Program onSignOut={onSignOut} user={user} />;
}

function AuthUnavailable({ message }: { message: string }) {
  return <main className="grid min-h-screen place-items-center bg-[#f5f7f2] px-5 text-slate-800"><section className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm"><h1 className="font-display text-2xl font-bold text-leaf-900">No se pudo iniciar el acceso</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><a className="mt-5 inline-block rounded-xl bg-leaf-600 px-4 py-3 text-sm font-bold text-white" href="/">Volver al inicio</a></section></main>;
}
