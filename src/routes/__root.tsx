import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
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
import { SupportWhatsApp } from "@/components/support-whatsapp";
import { BackButton } from "@/components/navigation/back-button";
import { Toaster } from "@/components/ui/sonner";
import { applyDisplayPrefs, readDisplayPrefs } from "@/lib/display-prefs";
import { registerOfflineSupport } from "@/lib/pwa";
import { syncAllPending, totalPending } from "@/lib/offline-sync";
import { pendingAnswersCount } from "@/lib/answer-log";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1E3A5F" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Jaikuaa" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Jaikuaa — Aprendé y jugá en guaraní" },
      { name: "description", content: "Desafíos diarios, juegos y voces reales. Plataforma paraguaya para aprender guaraní." },
      { name: "author", content: "Jaikuaa" },
      { property: "og:title", content: "Jaikuaa — Aprendé y jugá en guaraní" },
      { property: "og:description", content: "Desafíos diarios, juegos y voces reales. Plataforma paraguaya para aprender guaraní." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@jaikuaa" },
      { name: "twitter:title", content: "Jaikuaa — Aprendé y jugá en guaraní" },
      { name: "twitter:description", content: "Desafíos diarios, juegos y voces reales. Plataforma paraguaya para aprender guaraní." },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=4" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=4" },
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
  }),
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
    void redeemPendingPilotCode();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void redeemPendingPilotCode();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <BackButton />
      <SupportWhatsApp />
      {/* Los avisos breves ("Validación registrada", "Otra persona ya la validó"...). Arriba, para no tapar botones. */}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
