import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Shuffle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrabateCompara } from "@/components/voz/grabate-compara";
import { withOfflineCache } from "@/lib/offline-data";
import { PageHero } from "@/components/page-hero";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import { listPalabrasConVoz, type PalabraConVoz } from "@/lib/voz.functions";

export const Route = createFileRoute("/_authenticated/pronunciar")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Grabate y compará" },
      {
        name: "description",
        content: "Escuchá la voz de un hablante paraguayo, grabate diciendo lo mismo y compará las dos.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { p?: string } =>
    typeof s.p === "string" && s.p.length <= 120 ? { p: s.p } : {},
  component: Pronunciar,
});

function plano(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "");
}

function Pronunciar() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const listFn = useServerFn(listPalabrasConVoz);
  const { data, isLoading, error } = useQuery({
    queryKey: ["palabras-con-voz"],
    queryFn: () => withOfflineCache("palabras-con-voz", () => listFn(), { label: "Las palabras" }),
  });
  const items = useMemo(() => data?.items ?? [], [data]);
  const [q, setQ] = useState("");

  const elegida: PalabraConVoz | undefined = useMemo(
    () => items.find((w) => w.gn === search.p) ?? items[0],
    [items, search.p],
  );

  const elegir = (gn: string) => navigate({ search: { p: gn }, replace: true });
  function alAzar() {
    if (items.length < 2) return;
    let w = elegida;
    while (w === elegida) w = items[Math.floor(Math.random() * items.length)];
    if (w) elegir(w.gn);
  }

  useEffect(() => {
    if (elegida) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [elegida]);

  const lista = useMemo(() => {
    const n = plano(q.trim());
    const base = n ? items.filter((w) => plano(w.gn).includes(n) || plano(w.es).includes(n)) : items;
    return base.slice(0, 60);
  }, [items, q]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <PageHero img={jaiBienvenida} imgAlt="Jai con auriculares" eyebrow="Pronunciación" title="Grabate y compará">
            Escuchá a un hablante paraguayo, grabate diciendo lo mismo y compará las dos voces.
          </PageHero>

          {isLoading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />}
          {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}
          {!isLoading && !error && items.length === 0 && (
            <p className="mt-8 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Todavía no hay palabras con grabación publicadas.
            </p>
          )}

          {elegida && (
            <div className="mt-6">
              <GrabateCompara key={elegida.gn} gn={elegida.gn} es={elegida.es} />
              <Button variant="outline" className="mt-3 h-11 w-full" onClick={alAzar} disabled={items.length < 2}>
                <Shuffle className="h-4 w-4" /> Otra palabra al azar
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-foreground">Elegí una palabra</h2>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscá en guaraní o en castellano"
                  className="pl-9"
                />
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {lista.map((w) => (
                  <li key={w.gn}>
                    <button
                      type="button"
                      onClick={() => elegir(w.gn)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${
                        w.gn === elegida?.gn ? "border-primary bg-primary/5" : "bg-card"
                      }`}
                    >
                      <span className="block font-semibold text-foreground" lang="gn">
                        {w.gn}
                      </span>
                      <span className="block text-xs text-muted-foreground">{w.es}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {!q && items.length > lista.length && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Mostrando {lista.length} de {items.length}. Buscá para encontrar otras.
                </p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
