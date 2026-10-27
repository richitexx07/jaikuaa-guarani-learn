import { createFileRoute } from "@tanstack/react-router";
import { usePubTx, type PubKey } from "@/lib/i18n-public";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";
import bannerTurismo from "@/assets/banners/banner-turismo.webp";
import jaiTurismo from "@/assets/jai/jai-turismo.webp";
import { TRIVIA_ART } from "@/lib/trivia-art";
import destinoMonday from "@/assets/turismo/destino-monday.webp";
import destinoRuinas from "@/assets/turismo/destino-ruinas.webp";
import destinoItaipu from "@/assets/turismo/destino-itaipu.webp";
import destinoYpacarai from "@/assets/turismo/destino-ypacarai.webp";
import destinoCaacupe from "@/assets/turismo/destino-caacupe.webp";
import destinoChaco from "@/assets/turismo/destino-chaco.webp";

const MSG = "Hola, quisiera información sobre la Ruta Turística de Jai en Jaikuaa.";

const DESTINOS = [
  { img: destinoMonday, name: "Saltos del Monday y Monday Falls", zona: "Alto Paraná", desc: "Cataratas de 45 metros rodeadas de selva paranaense." },
  { img: destinoRuinas, name: "Ruinas Jesuíticas de Trinidad y Jesús", zona: "Itapúa", desc: "Patrimonio Mundial de la UNESCO, corazón de las misiones guaraníes." },
  { img: destinoItaipu, name: "Represa de Itaipú", zona: "Hernandarias", desc: "Una de las mayores obras de ingeniería del mundo, binacional con Brasil." },
  { img: destinoYpacarai, name: "San Bernardino y el Lago Ypacaraí", zona: "Cordillera", desc: "El clásico balneario paraguayo, inmortalizado en la música." },
  { img: destinoCaacupe, name: "Caacupé, capital espiritual", zona: "Cordillera", desc: "Basílica de la Virgen de Caacupé, destino de peregrinación cada 8 de diciembre." },
  { img: destinoChaco, name: "El Chaco Paraguayo", zona: "Boquerón y Pdte. Hayes", desc: "Inmensidad, estancias, fauna única y cielos estrellados incomparables." },
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
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
          <img
            src={bannerTurismo}
            alt={t("tuAlt")}
            className="mx-auto mb-10 aspect-[16/9] w-full max-w-5xl rounded-3xl object-cover shadow-elegant sm:aspect-[21/9]"
            width={1280}
            height={720}
          />
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {t("tuBadge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("tuTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("tuSub")}
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>{t("tuCta")}</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title={t("tuDest")} intro={t("tuDestI")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINOS.map((d, i) => (
              <article key={d.name} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant">
                <img src={d.img} alt={t("tuVisit", { a: d.name })} className="aspect-[4/3] w-full object-cover" width={800} height={600} loading="lazy" decoding="async" />
                <div className="flex flex-col gap-1 p-5">
                  <span className="text-xs font-semibold text-primary">{d.zona}</span>
                  <h3 className="font-display text-lg font-bold leading-tight text-foreground">{d.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(`tuD.${i}` as PubKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title={t("tuTravel")}>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard img={TRIVIA_ART.vocabulario} title={t("tuC1t")}>
              {t("tuC1")}
            </InfoCard>
            <InfoCard img={TRIVIA_ART.gastronomia} title={t("tuC2t")}>
              {t("tuC2")}
            </InfoCard>
            <InfoCard img={TRIVIA_ART.historia} title={t("tuC3t")} tag={t("inValidation")}>
              {t("tuC3")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("tuSector")}>
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <img
              src={jaiTurismo}
              alt={t("tuGuideAlt")}
              className="mx-auto -mt-2 mb-4 h-36 w-auto object-contain drop-shadow-lg sm:h-44"
              loading="lazy"
            />
            <h3 className="font-display text-xl font-bold text-foreground">{t("tuBiz")}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t("tuBizT")}
            </p>
            <div className="mt-6">
              <WhatsAppCta message="Hola, tengo un negocio turístico y quiero sumarme a la Ruta de Jai.">
                {t("tuBizCta")}
              </WhatsAppCta>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
