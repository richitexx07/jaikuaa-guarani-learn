import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { callarVoz } from "@/lib/voz-unica";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SplashScreen } from "@/components/splash-screen";
import { supabase } from "@/integrations/supabase/client";
import { redeemPendingPilotCode } from "@/lib/pilot-code";
import { lazy, Suspense } from "react";
// El botón de ayuda con Jai trae muchos textos: se descarga aparte, después de mostrar la pantalla.
const SupportWhatsApp = lazy(() => import("@/components/support-whatsapp").then((m) => ({ default: m.SupportWhatsApp })));
import { BackButton } from "@/components/navigation/back-button";
import { Toaster } from "@/components/ui/sonner";
import { applyDisplayPrefs, readDisplayPrefs } from "@/lib/display-prefs";
import { registerOfflineSupport } from "@/lib/pwa";
import { syncAllPending, totalPending } from "@/lib/offline-sync";
import { pendingAnswersCount } from "@/lib/answer-log";
import { captureSource, claimSource } from "@/lib/signup-source";
import { markHadAccount } from "@/lib/guest";
import { cleanRefCode, REF_STORAGE_KEY } from "@/lib/ambassador";
import { shareMetaFor } from "@/lib/share-meta";
import { GuardarPuntos } from "@/components/guardar-puntos";
import jaiSorpresa from "@/assets/jai/jai-sorpresa.webp";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img src={jaiSorpresa} alt="Jai, sorprendido, con las manos en la cara" className="mx-auto mb-4 h-40 w-auto object-contain" />
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscás no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Esta página no cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal de nuestro lado. Podés intentar refrescar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ matches }) => {
    const share = shareMetaFor(matches?.[matches.length - 1]?.pathname ?? "/");
    return {
    meta: [
      { charSet: "utf-8" },
      // Vista previa por defecto de cualquier enlace (las páginas con su propio título lo reemplazan).
      { title: share.title },
      { name: "description", content: share.description },
      { property: "og:title", content: share.title },
      { property: "og:description", content: share.description },
      { property: "og:image", content: share.image ?? "https://www.jaikuaa.com/og-jaikuaa.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: share.image ?? "https://www.jaikuaa.com/og-jaikuaa.jpg" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1E3A5F" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Jaikuaa" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "author", content: "Jaikuaa" },
      { property: "og:site_name", content: "Jaikuaa" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@jaikuaa" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
    ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Al cambiar de pantalla se calla la voz que estaba sonando (nunca queda un audio de la pantalla anterior).
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    callarVoz();
  }, [pathname]);

  // Código de invitación del piloto guardado antes de iniciar sesión: se canjea al entrar.
  useEffect(() => {
    applyDisplayPrefs(readDisplayPrefs());
    void registerOfflineSupport();
    // Al recuperar señal se envía todo lo hecho sin conexión; además se reintenta cada minuto
    // por si el aviso de «hay señal» del teléfono no llega (pasa en algunos Android).
    const onOnline = () => void syncAllPending();
    window.addEventListener("online", onOnline);
    // Al abrir la app con señal, se envía enseguida lo que quedó de antes.
    const hasPending = () => totalPending() > 0 || pendingAnswersCount() > 0;
    if (navigator.onLine && hasPending()) void syncAllPending();
    const timer = window.setInterval(() => {
      if (navigator.onLine && hasPending()) void syncAllPending();
    }, 60_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    // De dónde llegó la persona (?de=facebook, ?de=whatsapp…): se anota al crear la cuenta.
    captureSource();
    // Código de embajador (?ref=) en cualquier página: así se acredita aunque primero juegue sin cuenta.
    try {
      const ref = cleanRefCode(new URLSearchParams(window.location.search).get("ref"));
      if (ref) localStorage.setItem(REF_STORAGE_KEY, ref);
    } catch { /* sin almacenamiento */ }
    void redeemPendingPilotCode();
    void claimSource();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        markHadAccount();
        void redeemPendingPilotCode();
        void claimSource();
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <BackButton />
      <GuardarPuntos />
      <Suspense fallback={null}>
        <SupportWhatsApp />
      </Suspense>
      {/* Los avisos breves ("Validación registrada", "Otra persona ya la validó"...). Arriba, para no tapar botones. */}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
