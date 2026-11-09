import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, isNetworkError, isOffline } from "@/lib/offline-data";
import { OfflineStatusBar } from "@/components/offline/offline-status-bar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { InstallBanner } from "@/components/navigation/install-banner";
import { showsBottomNav } from "@/lib/bottom-nav";
import { rememberAfterLogin } from "@/lib/after-login";
import { PreLaunchBanner } from "@/components/validation-notice";
import { authMode, isGuestPath, markHadAccount, useIsGuest } from "@/lib/guest";
import { AppLoading } from "@/components/app-loading";
import { decodeReto } from "@/lib/reto";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Sin señal no se puede confirmar la sesión con el servidor: se deja entrar con la última
    // sesión guardada en el teléfono (los datos del servidor igual piden una sesión válida).
    const offlineUser = () => {
      const u = getStoredUser();
      return u ? { user: { id: u.id, email: u.email } as unknown as User } : null;
    };
    // Algunos juegos se pueden jugar sin cuenta: la cuenta se pide para guardar los puntos.
    // Los enlaces de reto (?reto=) sí piden cuenta: el reto guarda nombre y puntaje de cada uno.
    // Los retos de la base (con tabla) piden cuenta; los que viajan en el enlace (los que manda un invitado), no.
    const retoRaw = new URL(location.href, "https://www.jaikuaa.com").searchParams.get("reto");
    // Quien recibe un reto por WhatsApp entra a jugar la misma partida sin crear cuenta.
    const retoSinCuenta = !retoRaw || decodeReto(retoRaw) !== null || /^[A-Za-z0-9]{6,12}$/.test(retoRaw);
    const guest = isGuestPath(location.pathname) && retoSinCuenta ? { user: null as User | null } : null;
    if (isOffline()) {
      const ok = offlineUser();
      if (ok) return ok;
      if (guest) return guest;
      throw redirect({ to: "/auth", search: { mode: authMode() } });
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        markHadAccount();
        return { user: data.user };
      }
      if (error && isNetworkError(error)) {
        const ok = offlineUser();
        if (ok) return ok;
      }
    } catch (e) {
      if (isNetworkError(e)) {
        const ok = offlineUser();
        if (ok) return ok;
      }
    }
    if (guest) return guest;
    rememberAfterLogin(location.href);
    // Quien nunca tuvo cuenta en este celular ve «Crear cuenta»; quien ya tuvo, «Iniciar sesión».
    throw redirect({ to: "/auth", search: { mode: authMode() } });
  },
  // Mientras se arma la sección (enlace directo o primera visita), se ve Jaikuaa cargando y no una pantalla blanca.
  pendingComponent: AppLoading,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const matches = useMatches();
  const key = matches[matches.length - 1]?.pathname ?? "/";
  const withNav = showsBottomNav(key);
  const guest = useIsGuest();
  return (
    <>
      <OfflineStatusBar />
      <PreLaunchBanner invitado={guest} />
      <div key={key} className={`page-in ${withNav ? "pb-20 md:pb-0" : ""}`}>
        <Outlet />
      </div>
      <MobileBottomNav />
      <InstallBanner />
    </>
  );
}
