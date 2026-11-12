import { useTX, type TXKey } from "@/lib/i18n-pages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { ReportErrorButton } from "@/components/report-error-button";
import { PageHero } from "@/components/page-hero";
import jaiProfe from "@/assets/jai-profe.webp";
import { listGlossary } from "@/lib/glossary.functions";
import { localizarVocab } from "@/lib/significado";
import { useAppLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/glosario")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Glosario" },
      { name: "description", content: "Las palabras publicadas de Jaikuaa, con su significado y su audio." },
      { property: "og:title", content: "Jaikuaa — Glosario" },
      { property: "og:description", content: "Consultá las palabras publicadas en Jaikuaa, con su significado y grabaciones humanas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GlossaryPage,
});

/** Para buscar sin importar tildes, nasales ni mayúsculas. */
function plain(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "");
}

function GlossaryPage() {
  const tx = useTX();
  const listFn = useServerFn(listGlossary);
  const { data, isLoading, error } = useQuery({
    queryKey: ["glossary"],
    queryFn: () => withOfflineCache(K.glossary, () => listFn(), { label: "El glosario" }),
  });
  const [q, setQ] = useState("");

  // El significado en el idioma de la persona (solo lo aprobado por un docente; si falta, en castellano).
  const lang = useAppLang();
  const items = useMemo(() => localizarVocab(data?.items ?? [], lang), [data?.items, lang]);
  const shown = useMemo(() => {
    const needle = plain(q.trim());
    if (!needle) return items;
    return items.filter((w) => plain(w.gn).includes(needle) || plain(w.es).includes(needle));
  }, [items, q]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">{tx("back")}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-3xl">
          <PageHero img={jaiProfe} imgAlt={tx("glJaiAlt")} title={tx("glTitle")}>
            {tx("glIntro")}
          </PageHero>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx("glSearch")}
              className="pl-9"
              aria-label={tx("glSearchLabel")}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {tx("loading")}
            </p>
          )}
          {error && (
            <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error.name === "OfflineMissingError"
                ? tx("glOffline")
                : tx("glError")}
            </p>
          )}

          {!isLoading && !error && (
            <>
              <p className="mt-4 text-xs text-muted-foreground">
                {shown.length === items.length
                  ? tx("glCount", { n: items.length.toLocaleString("es-PY") })
                  : tx("glCountOf", { a: shown.length.toLocaleString("es-PY"), n: items.length.toLocaleString("es-PY") })}
              </p>
              {shown.length === 0 ? (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  {tx("glNone")}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
                  {shown.map((w) => (
                    <li key={w.gn} className="flex items-center gap-3 px-4 py-3">
                      <SpeakerButton gn={w.gn} />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-semibold text-foreground">{w.gn}</div>
                        <div className="text-sm text-muted-foreground">{w.es}</div>
                      </div>
                      {w.validated && (
                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 sm:inline-flex">
                          {tx("glReviewed")}
                        </span>
                      )}
                      <ReportErrorButton gn={w.gn} es={w.orig} lugar="Glosario" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
