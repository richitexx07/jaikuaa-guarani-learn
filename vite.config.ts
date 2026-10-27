// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// La lista de archivos que se guardan al instalar no depende de dónde deja el build los archivos:
// la página sin señal y el ícono van siempre.
const rev = (path: string) => {
  try {
    return createHash("md5").update(readFileSync(path)).digest("hex").slice(0, 12);
  } catch {
    return String(Date.now());
  }
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false,
        devOptions: { enabled: false },
        filename: "sw.js",
        outDir: "dist/client",
        workbox: {
          // El código y los estilos NO van en esta lista: se guardan al usarse (ver «jaikuaa-app»
          // abajo) y así no se borran al publicar una versión nueva. Si se borraran, una pantalla
          // guardada antes quedaría colgada en la pantalla de inicio sin señal.
          globPatterns: ["offline.html"],
          additionalManifestEntries: [
            { url: "/offline.html", revision: rev("public/offline.html") },
            { url: "/manifest.webmanifest", revision: rev("public/manifest.webmanifest") },
            { url: "/icon-192.png", revision: rev("public/icon-192.png") },
          ],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // Páginas: siempre intenta la red primero; sin señal usa la última copia.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "jaikuaa-pages",
                networkTimeoutSeconds: 4,
                // Las pantallas descargadas para usar sin internet no deben borrarse por cantidad.
                expiration: { maxEntries: 150, maxAgeSeconds: 60 * 24 * 3600 },
                matchOptions: { ignoreVary: true },
                plugins: [
                  {
                    // Sin señal y sin copia de esa pantalla: una página propia con enlaces a lo descargado.
                    handlerDidError: async () =>
                      (await caches.match("/offline.html", { ignoreSearch: true })) ?? undefined,
                  },
                ],
              },
            },
            {
              // Los archivos de la app (código, estilos, imágenes de los juegos). Su nombre cambia con
              // cada versión, así que una copia guardada nunca queda vieja. Se guardan al usarlos y
              // se conservan las de versiones anteriores: una pantalla guardada hace días sigue
              // abriendo sin señal aunque después se haya publicado una versión nueva.
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
              handler: "CacheFirst",
              options: {
                cacheName: "jaikuaa-app",
                expiration: { maxEntries: 1500, maxAgeSeconds: 90 * 24 * 3600 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // Imágenes subidas al proyecto (logo de inicio, portadas).
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/__l5e/assets-v1/"),
              handler: "CacheFirst",
              options: {
                cacheName: "jaikuaa-imagenes",
                expiration: { maxEntries: 200, maxAgeSeconds: 90 * 24 * 3600 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // Audios humanos: el enlace firmado cambia, se identifica por nombre de archivo.
              urlPattern: ({ url }) =>
                url.pathname.includes("/storage/v1/object/sign/guarani-audio/"),
              // Se pide el archivo COMPLETO y en modo CORS: así la copia guardada se puede leer y
              // recortar para el reproductor. Una copia «opaca» (estado 0) no se puede reproducir
              // desde el caché y dejaba los audios mudos a partir de la segunda vez.
              handler: "CacheFirst",
              options: {
                cacheName: "jaikuaa-audio-v2",
                matchOptions: { ignoreSearch: true },
                expiration: { maxEntries: 600, maxAgeSeconds: 90 * 24 * 3600 },
                cacheableResponse: { statuses: [200] },
                rangeRequests: true,
                plugins: [
                  {
                    requestWillFetch: async ({ request }) =>
                      new Request(request.url, { mode: "cors", credentials: "omit" }),
                  },
                ],
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "jaikuaa-fonts", expiration: { maxEntries: 20 } },
            },
          ],
        },
      }),
    ],
  },
});
