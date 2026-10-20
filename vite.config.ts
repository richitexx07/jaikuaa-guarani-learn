// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

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
          globPatterns: ["**/*.{js,css,png,svg,ico,woff2,webmanifest}"],
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
                expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 },
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
