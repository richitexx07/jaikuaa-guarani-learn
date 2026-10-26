import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourseLessons } from "@/lib/lessons.functions";
import { withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { pendingLessonRefs } from "@/lib/gamification";
import { getLanguage } from "@/lib/languages";
import { Check, Lock } from "lucide-react";
import bannerCurso from "@/assets/banners/banner-curso.webp";

const PATH_CSS = `
.path-dash { background: repeating-linear-gradient(to bottom, color-mix(in oklab, var(--border) 100%, transparent) 0 8px, transparent 8px 14px); }
.path-next { box-shadow: 0 0 0 0 color-mix(in oklab, var(--accent) 55%, transparent); animation: path-pulse 2s ease-out infinite; }
@keyframes path-pulse { 70% { box-shadow: 0 0 0 12px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
@media (prefers-reduced-motion: reduce) { .path-next { animation: none; } }
`;

export const Route = createFileRoute("/_authenticated/curso/$lang/")({
  head: ({ params }) => {
    const name = getLanguage(params.lang)?.name ?? "Guaraní";
    const title = `Curso de ${name} | Jaikuaa`;
    const description = `Lecciones de ${name} con vocabulario publicado y audio de voces reales en Jaikuaa.`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: CourseIndex,
});

function CourseIndex() {
  const { lang: langSlug } = useParams({ from: "/_authenticated/curso/$lang/" });
  const lang = getLanguage(langSlug)!;
  const isGuarani = lang.slug === "guarani";
  const listFn = useServerFn(listCourseLessons);
  const lessonsQ = useQuery({
    queryKey: ["course-lessons"],
    queryFn: () => withOfflineCache(K.lessons, () => listFn(), { label: "El curso" }),
    enabled: isGuarani,
  });
  // Las lecciones terminadas sin señal cuentan ya: así se desbloquea la siguiente en el momento.
  const pendingDone = pendingLessonRefs();
  const dbLessons = (lessonsQ.data?.lessons ?? []).map((l) =>
    pendingDone.has(`guarani:${l.n}`) ? { ...l, completed: true } : l,
  );
  const byN = new Map(dbLessons.map((l) => [l.n, l]));
  const lessons = isGuarani
    ? dbLessons.map((l) => l.n)
    : Array.from({ length: 10 }, (_, i) => i + 1);
  // Desbloqueo progresivo: la primera abierta, y cada una tras completar la anterior.
  const unlockedSet = new Set<number>();
  dbLessons.forEach((l, i) => {
    if (i === 0 || l.completed || dbLessons[i - 1]!.completed) unlockedSet.add(l.n);
  });
  const doneCount = dbLessons.filter((l) => l.completed).length;
  const nextN =
    dbLessons.find((l) => unlockedSet.has(l.n) && !l.completed && l.publishedWords > 0)?.n ??
    (doneCount > 0 ? undefined : undefined);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        <style>{PATH_CSS}</style>
        <div className="mx-auto max-w-3xl">
          {/* Cabecera ilustrada: el camino del curso, con el título y el progreso encima */}
          <section className="relative overflow-hidden rounded-3xl shadow-elegant">
            <img
              src={bannerCurso}
              alt="Jai camina con su mochila por un sendero de piedras entre lomas y lapachos"
              className="aspect-[16/10] w-full object-cover sm:aspect-[16/8]"
              width={1280}
              height={720}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B33]/90 via-[#0D1B33]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Curso de {lang.name}</h1>
                {lang.featured && (
                  <span className="rounded-full bg-[#F6C445] px-2.5 py-0.5 text-xs font-bold text-[#3A1A05]">Destacado</span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/80">
                {isGuarani ? `${lessons.length} lecciones` : "10 lecciones"} con voces humanas paraguayas
              </p>
              {isGuarani && dbLessons.length > 0 && (
                <div className="mt-3 max-w-md">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/85">
                    <span>Tu progreso</span>
                    <span>{doneCount} de {dbLessons.length}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-[#3DE0B0] transition-all" style={{ width: `${(doneCount / dbLessons.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {isGuarani && nextN !== undefined && (
            <Button asChild variant="cta" size="lg" className="mt-5 h-14 w-full text-base">
              <Link to="/curso/$lang/leccion/$n" params={{ lang: lang.slug, n: String(nextN) }}>
                {doneCount === 0 ? "Empezar" : "Continuar"} con la Lección {nextN}
              </Link>
            </Button>
          )}

          {/* El camino: cada lección es una parada; la línea muestra hasta dónde llegaste */}
          <ol className="relative mt-8">
            {lessons.map((n, i) => {
              const info = isGuarani ? byN.get(n) : undefined;
              const inValidation = !!info && info.publishedWords === 0;
              const unlocked = isGuarani ? unlockedSet.has(n) && !inValidation : n === 1;
              const isDone = !!info?.completed;
              const isNext = n === nextN;
              const title = info?.title;
              const last = i === lessons.length - 1;
              const estado = inValidation
                ? "En validación"
                : isDone
                  ? "Completada · podés repasarla"
                  : unlocked
                    ? "Disponible"
                    : "Completá la anterior para abrirla";
              const card = (
                <div
                  className={`flex flex-1 items-center justify-between gap-3 rounded-2xl border p-4 transition sm:p-5 ${
                    isNext
                      ? "border-accent bg-card shadow-lift"
                      : unlocked
                        ? "border-border/60 bg-card shadow-sm group-hover:-translate-y-0.5 group-hover:border-accent/60 group-hover:shadow-md"
                        : "border-border/40 bg-muted/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-display text-base font-semibold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      Lección {n}
                      {title && <span className="font-normal text-muted-foreground"> · {title}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{estado}</p>
                  </div>
                  {unlocked ? (
                    <span className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold ${isDone ? "bg-muted text-foreground" : "bg-accent text-accent-foreground"}`}>
                      {isDone ? "Repasar" : "Empezar"}
                    </span>
                  ) : (
                    <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Bloqueada" />
                  )}
                </div>
              );
              return (
                <li key={n} className="relative flex gap-4 pb-4">
                  {!last && (
                    <span
                      aria-hidden
                      className={`absolute left-[1.375rem] top-12 bottom-0 w-1 rounded-full ${isDone ? "bg-accent" : "path-dash"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-background font-display text-base font-bold shadow-md ${
                      isDone
                        ? "bg-accent text-accent-foreground"
                        : isNext
                          ? "path-next bg-primary text-primary-foreground"
                          : unlocked
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : n}
                  </span>
                  {unlocked && isGuarani ? (
                    <Link to="/curso/$lang/leccion/$n" params={{ lang: lang.slug, n: String(n) }} className="group flex flex-1">
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </main>
    </div>
  );
}
