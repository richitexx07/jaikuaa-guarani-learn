import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";
import bannerTurismo from "@/assets/banners/banner-turismo.webp";
import jaiTurismo from "@/assets/jai/jai-turismo.webp";

const MSG = "Hola, quisiera información sobre la Ruta Turística de Jai en Jaikuaa.";

const DESTINOS = [
  { emoji: "💧", name: "Saltos del Monday y Monday Falls", zona: "Alto Paraná", desc: "Cataratas de 45 metros rodeadas de selva paranaense." },
  { emoji: "🏛️", name: "Ruinas Jesuíticas de Trinidad y Jesús", zona: "Itapúa", desc: "Patrimonio Mundial de la UNESCO, corazón de las misiones guaraníes." },
  { emoji: "🌊", name: "Represa de Itaipú", zona: "Hernandarias", desc: "Una de las mayores obras de ingeniería del mundo, binacional con Brasil." },
  { emoji: "🏖️", name: "San Bernardino y el Lago Ypacaraí", zona: "Cordillera", desc: "El clásico balneario paraguayo, inmortalizado en la música." },
  { emoji: "⛪", name: "Caacupé, capital espiritual", zona: "Cordillera", desc: "Basílica de la Virgen de Caacupé, destino de peregrinación cada 8 de diciembre." },
  { emoji: "🌵", name: "El Chaco Paraguayo", zona: "Boquerón y Pdte. Hayes", desc: "Inmensidad, estancias, fauna única y cielos estrellados incomparables." },
] as const;

export const Route = createFileRoute("/turismo")({
  head: () => ({
    meta: [
      { title: "Jai Turístico — Recorré Paraguay con Jaikuaa" },
      {
        name: "description",
        content:
          "Ruta turística y cultural de Paraguay: destinos emblemáticos, gastronomía y vocabulario guaraní del viajero para conocer el país como un local.",
      },
      { property: "og:title", content: "Jai Turístico — Recorré Paraguay con Jaikuaa" },
      {
        property: "og:description",
        content: "Destinos emblemáticos, cultura e historia de Paraguay, con vocabulario guaraní del viajero.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/turismo" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/turismo" }],
  }),
  component: TurismoPage,
});

function TurismoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
          <img
            src={bannerTurismo}
            alt="Jai saluda con un mate en la mano, al atardecer, junto a un lago y una iglesia colonial"
            className="mx-auto mb-10 aspect-[16/9] w-full max-w-5xl rounded-3xl object-cover shadow-elegant sm:aspect-[21/9]"
            width={1280}
            height={720}
          />
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Jai Turístico
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Recorré Paraguay con Jai
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Nuestro jaguarete te guía por los lugares más hermosos del país: naturaleza, historia, cultura y
              gastronomía, con el guaraní del viajero para vivirlo como un local.
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>Quiero recorrer Paraguay</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title="Destinos de la ruta" intro="Una selección inicial de lugares emblemáticos. La ruta crece con cada aliado turístico.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINOS.map((d) => (
              <div key={d.name} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
                <span className="text-3xl" aria-hidden>{d.emoji}</span>
                <h3 className="font-display text-lg font-bold text-foreground">{d.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{d.zona}</span>
                <p className="text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="El guaraní del viajero">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🗣️" title="Frases para viajar">
              Saludos, cómo preguntar direcciones, pedir comida y agradecer en guaraní, con audio de voces paraguayas.
            </InfoCard>
            <InfoCard emoji="🍲" title="Gastronomía con nombre propio">
              Chipa, sopa paraguaya, mbeju, tereré: qué es cada plato y cómo se pide, revisado por docentes especialistas.
            </InfoCard>
            <InfoCard emoji="📖" title="Historia viva" tag="En validación">
              El vocabulario cultural e histórico de cada destino se publica solo tras la revisión de docentes de la
              lengua.
            </InfoCard>
          </div>
        </Section>

        <Section title="Para el sector turismo">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <img
              src={jaiTurismo}
              alt="Jai, guía turístico, saluda con un mate"
              className="mx-auto -mt-2 mb-4 h-36 w-auto object-contain drop-shadow-lg sm:h-44"
              loading="lazy"
            />
            <h3 className="font-display text-xl font-bold text-foreground">Hoteles, posadas, operadores y gastronomía</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Sumá tu negocio a la Ruta de Jai: aparecés en el destino correspondiente, recibís consultas directas de
              viajeros y accedés a un reporte mensual de interesados.
            </p>
            <div className="mt-6">
              <WhatsAppCta message="Hola, tengo un negocio turístico y quiero sumarme a la Ruta de Jai.">
                Sumar mi negocio a la ruta
              </WhatsAppCta>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
