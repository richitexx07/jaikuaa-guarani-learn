import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, isNetworkError, isOffline } from "@/lib/offline-data";
import { OfflineStatusBar } from "@/components/offline/offline-status-bar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { InstallBanner } from "@/components/navigation/install-banner";
import { showsBottomNav } from "@/lib/bottom-nav";
import { rememberAfterLogin } from "@/lib/after-login";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Sin señal no se puede confirmar la sesión con el servidor: se deja entrar con la última
    // sesión guardada en el teléfono (los datos del servidor igual piden una sesión válida).
    const offlineUser = () => {
      const u = getStoredUser();
      return u ? { user: { id: u.id, email: u.email } as unknown as User } : null;
    };
    if (isOffline()) {
      const ok = offlineUser();
      if (ok) return ok;
      throw redirect({ to: "/auth", search: { mode: "login" } });
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) return { user: data.user };
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
    rememberAfterLogin(location.href);
    throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const matches = useMatches();
  const key = matches[matches.length - 1]?.pathname ?? "/";
  const withNav = showsBottomNav(key);
  return (
    <>
      <OfflineStatusBar />
      <div key={key} className={`page-in ${withNav ? "pb-20 md:pb-0" : ""}`}>
        <Outlet />
      </div>
      <MobileBottomNav />
      <InstallBanner />
    </>
  );
}
