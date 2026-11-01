import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Jugar sin cuenta: quien llega por un video o un reto puede jugar primero y registrarse después.
 * Los puntos de quien juega sin cuenta quedan en el celular y pasan a su cuenta al registrarse
 * (ver gamification.ts: «local-migration»).
 */

/** Juegos que se pueden jugar sin cuenta (los demás piden registrarse). */
export const GUEST_GAMES = [
  "/juegos",
  "/juegos/ahorcado",
  "/juegos/sopa-de-letras",
  "/juegos/memoria",
  "/juegos/duelo",
  "/juegos/trivia-duelo",
  "/juegos/penales",
] as const;

export function isGuestPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (GUEST_GAMES as readonly string[]).includes(p);
}

/** Este celular ya tuvo una cuenta abierta alguna vez: al pedir sesión se muestra «Iniciar sesión». */
const HAD_ACCOUNT_KEY = "jaikuaa:tuvo-cuenta";

export function markHadAccount() {
  try { localStorage.setItem(HAD_ACCOUNT_KEY, "1"); } catch { /* sin almacenamiento */ }
}

export function hadAccount(): boolean {
  try {
    if (localStorage.getItem(HAD_ACCOUNT_KEY)) return true;
    // Sesiones de antes de este cambio: si hay una sesión guardada de Supabase, ya tuvo cuenta.
    return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  } catch {
    return false;
  }
}

/** A qué pantalla de la cuenta mandar: crear cuenta si nunca la tuvo, iniciar sesión si ya la tuvo. */
export function authMode(): "login" | "signup" {
  return hadAccount() ? "login" : "signup";
}

/** true mientras no hay sesión en este celular (jugando como invitado). */
export function useIsGuest(): boolean {
  // Primera respuesta al instante (sin esperar al servidor) para no pedir datos de cuenta a un invitado.
  const [guest, setGuest] = useState(() => typeof window !== "undefined" && !storedSession());
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => { if (alive) setGuest(!data.session); });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setGuest(!session));
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  return guest;
}

/** Hay una sesión de Supabase guardada en este celular (lectura rápida, sin red). */
function storedSession(): boolean {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token") && !!localStorage.getItem(k));
  } catch {
    return true;
  }
}

/** ¿Hay sesión ahora? (para elegir entre la versión con cuenta y la de invitado de una consulta). */
export async function hasSessionNow(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}
