import { createFileRoute, Link } from "@tanstack/react-router";
import { usePubTx, type PubKey } from "@/lib/i18n-public";
import { PrivateGate } from "@/components/private-gate";
import { SiteFooter } from "@/components/site-footer";
import { InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";

const MSG = "Hola, soy del sector audiovisual y quiero información sobre Ta'anga Jaikuaa (cine y guiones en guaraní).";

const REGISTROS = [
  { emoji: "🏙️", name: "Urbano · Jopara", desc: "Diálogos de calle, mercado y barrio, con la mezcla natural del habla cotidiana." },
  { emoji: "🌾", name: "Campesino · Guaraní profundo", desc: "Giros y modismos del interior para historias rurales y familiares." },
  { emoji: "📜", name: "Histórico · Solemne", desc: "Registro cuidado para series de época, documentales y relatos patrimoniales." },
] as const;

export const Route = createFileRoute("/cine")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Ta'anga Jaikuaa — Cine y guiones en guaraní" },
      { name: "description", content: "Herramienta y vitrina para el cine paraguayo: guiones bilingües, revisión lingüística humana y difusión de series y películas en guaraní." },
      { property: "og:title", content: "Ta'anga Jaikuaa — Cine y guiones en guaraní" },
      { property: "og:description", content: "Escribí, revisá y mostrá tu cine en guaraní. La vitrina del audiovisual paraguayo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/cine" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/cine" }],
  }),
  ssr: false,
  component: () => <PrivateGate><CinePage /></PrivateGate>,
});

function CinePage() {
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {t("ciBadge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("ciT1")}
              <br />
              <span className="text-accent">{t("ciT2")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("ciSub")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <WhatsAppCta message={MSG}>{t("ciCta")}</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title={t("ciCreators")} intro={t("ciCreatorsI")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard emoji="📝" title={t("ciA1t")} tag={t("soon")}>
              {t("ciA1")}
            </InfoCard>
            <InfoCard emoji="🧑‍🏫" title={t("ciA2t")}>
              {t("ciA2")}
            </InfoCard>
            <InfoCard emoji="📚" title={t("ciA3t")}>
              {t("ciA3")}
            </InfoCard>
            <InfoCard emoji="📄" title={t("ciA4t")} tag={t("soon")}>
              {t("ciA4")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("ciTone")}>
          <div className="grid gap-5 sm:grid-cols-3">
            {REGISTROS.map((r, i) => (
              <div key={r.name} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
                <span className="text-3xl" aria-hidden>{r.emoji}</span>
                <h3 className="font-display text-lg font-bold text-foreground">{t(`ciR.${i}` as PubKey)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`ciRD.${i}` as PubKey)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("ciShow")} intro={t("ciShowI")}>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🎞️" title={t("ciB1t")}>
              {t("ciB1")}
            </InfoCard>
            <InfoCard emoji="🎧" title={t("ciB2t")} tag={t("soon")}>
              {t("ciB2")}
            </InfoCard>
            <InfoCard emoji="🏆" title={t("ciB3t")} tag={t("soon")}>
              {t("ciB3")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("ciPlay")}>
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h3 className="font-display text-xl font-bold text-foreground">Ta'anga · Claqueta de Jai</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t("ciPlayT")}
            </p>
            <Link to="/juegos/taanga" className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {t("ciPlayNow")}
            </Link>
          </div>
        </Section>

        <Section title={t("ciProd")}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-muted-foreground">
              {t("ciProdT")}
            </p>
            <div className="mt-6">
              <WhatsAppCta message="Hola, represento a una productora/marca y quiero conocer Ta'anga Jaikuaa.">
                {t("ciTalk")}
              </WhatsAppCta>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
