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
import { GuestBar } from "@/components/guest-bar";

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
    const guest = isGuestPath(location.pathname) && !/[?&]reto=/.test(location.href) ? { user: null as User | null } : null;
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
      {guest && <GuestBar />}
      <PreLaunchBanner />
      <div key={key} className={`page-in ${withNav ? "pb-20 md:pb-0" : ""}`}>
        <Outlet />
      </div>
      <MobileBottomNav />
      <InstallBanner />
    </>
  );
}
