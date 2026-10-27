import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import { ValidationNotice } from "@/components/validation-notice";

export const Route = createFileRoute("/_authenticated/nhe-mbytepe")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Ñe'ẽ Mbytépe" },
      {
        name: "description",
        content:
          "El guaraní que se habla en la calle: jopara con su forma pura, explicado con respeto.",
      },
      { property: "og:title", content: "Jaikuaa — Ñe'ẽ Mbytépe" },
      { property: "og:description", content: "Explorá el espacio de Jaikuaa dedicado al guaraní de uso cotidiano, con materiales en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NheMbytepe,
});

type Token = { text: string; lang: "gn" | "es" };

type Phrase = {
  jopara: Token[];
  puro: string;
  context: string;
};

const PHRASES: Phrase[] = [
  {
    jopara: [
      { text: "Che,", lang: "gn" },
      { text: "¿mba'e", lang: "gn" },
      { text: "la", lang: "es" },
      { text: "porte?", lang: "es" },
    ],
    puro: "¿Mba'éichapa reiko?",
    context: "Entre amigos, jóvenes",
  },
  {
    jopara: [
      { text: "Che,", lang: "gn" },
      { text: "vamos", lang: "es" },
      { text: "a", lang: "es" },
      { text: "comer", lang: "es" },
      { text: "mandi'o", lang: "gn" },
    ],
    puro: "Che, jaha karu mandi'o",
    context: "Familia, almuerzo",
  },
  {
    jopara: [
      { text: "¿Reko", lang: "gn" },
      { text: "peteĩ", lang: "gn" },
      { text: "mate?", lang: "es" },
    ],
    puro: "¿Reko peteĩ ka'ay?",
    context: "Social, cualquier edad",
  },
  {
    jopara: [
      { text: "Mi", lang: "es" },
      { text: "taita", lang: "gn" },
      { text: "está", lang: "es" },
      { text: "en", lang: "es" },
      { text: "el", lang: "es" },
      { text: "campo", lang: "es" },
    ],
    puro: "Che taita oĩ kokuepe",
    context: "Familiar, respetuoso",
  },
  {
    jopara: [
      { text: "Che,", lang: "gn" },
      { text: "nde", lang: "gn" },
      { text: "tía", lang: "es" },
      { text: "es", lang: "es" },
      { text: "buena", lang: "es" },
      { text: "onda", lang: "es" },
    ],
    puro: "Che, nde tía iporãiterei",
    context: "Jóvenes, informal",
  },
  {
    jopara: [
      { text: "Nde", lang: "gn" },
      { text: "roga", lang: "gn" },
      { text: "es", lang: "es" },
      { text: "grande", lang: "es" },
    ],
    puro: "Nde rógatuicha",
    context: "Cualquier edad, visita",
  },
  {
    jopara: [
      { text: "Che", lang: "gn" },
      { text: "vy'a", lang: "gn" },
      { text: "por", lang: "es" },
      { text: "vos", lang: "es" },
    ],
    puro: "Che vy'a nendive",
    context: "Amigos, familiar",
  },
  {
    jopara: [
      { text: "Jaha", lang: "gn" },
      { text: "a", lang: "es" },
      { text: "comer", lang: "es" },
    ],
    puro: "Jaha karu",
    context: "Amigos, familiar",
  },
  {
    jopara: [
      { text: "Jaha", lang: "gn" },
      { text: "a", lang: "es" },
      { text: "la", lang: "es" },
      { text: "casa", lang: "es" },
    ],
    puro: "Jaha rogape",
    context: "Amigos, familiar",
  },
  {
    jopara: [
      { text: "Jaha", lang: "gn" },
      { text: "a", lang: "es" },
      { text: "la", lang: "es" },
      { text: "iglesia", lang: "es" },
    ],
    puro: "Jaha tupáope",
    context: "Familiar, domingos",
  },
];

const GN_COLOR = "#1E3A5F";
const ES_COLOR = "#C8102E";

function NheMbytepe() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ValidationNotice />
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <BrandLogo />
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <img src={jaiSaluda} alt="Jai saluda" className="mx-auto h-28 w-auto object-contain drop-shadow-lg sm:h-36" />
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Ñe'ẽ Mbytépe
            </h1>
            <p className="mt-2 text-base font-medium text-muted-foreground sm:text-lg">
              El guaraní que se habla en la calle
            </p>
            <div className="mx-auto mt-4 max-w-2xl space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                El jopara no es un error. Es el abrazo entre dos lenguas.
              </p>
              <p>
                Así hablamos los paraguayos: sin filtros, sin vergüenza, con alma.
              </p>
              <p>
                Aquí lo estudiamos con respeto, porque lo vivo también merece ser entendido.
              </p>
            </div>


            <div className="mx-auto mt-5 inline-flex max-w-xl items-center gap-2 rounded-md border border-dashed border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary/80">
              Validado con hablantes nativos · en proceso de validación oficial
            </div>


            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: GN_COLOR }}
                  aria-hidden
                />
                Palabras en guaraní
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: ES_COLOR }}
                  aria-hidden
                />
                Palabras en español
              </span>
            </div>
          </div>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            {PHRASES.map((p, i) => (
              <article
                key={i}
                className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-elegant"
              >
                <div className="font-display text-xl font-semibold leading-snug sm:text-2xl">
                  {p.jopara.map((t, j) => (
                    <span
                      key={j}
                      style={{ color: t.lang === "gn" ? GN_COLOR : ES_COLOR }}
                    >
                      {t.text}
                      {j < p.jopara.length - 1 ? " " : ""}
                    </span>
                  ))}
                </div>
                <div className="mt-3 border-t border-dashed border-border/60 pt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Forma pura
                  </div>
                  <div className="mt-1 text-sm text-foreground sm:text-base">
                    {p.puro}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {p.context}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <footer className="mx-auto mt-10 max-w-2xl rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 text-center text-xs font-medium text-primary/80">
            Validado con hablantes nativos · en proceso de validación oficial
          </footer>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
