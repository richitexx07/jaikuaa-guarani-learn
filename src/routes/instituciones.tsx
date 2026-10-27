import { createFileRoute } from "@tanstack/react-router";
import { usePubTx } from "@/lib/i18n-public";
import { SiteFooter } from "@/components/site-footer";
import { BarChart3, BookOpen, Handshake, KeyRound, MessagesSquare, Mic, Scale, Smartphone, WifiOff } from "lucide-react";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";
import { BackingList, HeroJai, InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";

const MSG = "Hola, quisiera información sobre el plan piloto de Jaikuaa para nuestra institución.";

export const Route = createFileRoute("/instituciones")({
  head: () => ({
    meta: [
      { title: "Jaikuaa para instituciones — Piloto sin costo" },
      {
        name: "description",
        content:
          "Plan piloto de 12 semanas, sin costo, para que funcionarios y equipos fortalezcan su guaraní oral y escrito con una herramienta paraguaya.",
      },
      { property: "og:title", content: "Jaikuaa para instituciones" },
      { property: "og:description", content: "Piloto de 12 semanas sin costo para ministerios, entes, municipios y empresas." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/instituciones" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-instituciones.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Jaikuaa para instituciones" },
      { name: "twitter:description", content: "Piloto de 12 semanas sin costo para ministerios, entes, municipios y empresas." },
      { name: "twitter:image", content: "https://www.jaikuaa.com/og-instituciones.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/instituciones" }],
  }),
  component: InstitucionesPage,
});

function InstitucionesPage() {
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-8 pb-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <HeroJai src={jaiAtencion} alt={t("inAlt")} />
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {t("inBadge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("inTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("inSub")}
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>{t("inCta")}</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title={t("inWhy")}>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard icon={MessagesSquare} title={t("inW1t")}>
              {t("inW1")}
            </InfoCard>
            <InfoCard icon={Scale} title={t("inW2t")}>
              {t("inW2")}
            </InfoCard>
            <InfoCard icon={Handshake} title={t("inW3t")}>
              {t("inW3")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("inInc")} intro={t("inIncI")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={KeyRound} title={t("inI1t")}>
              {t("inI1")}
            </InfoCard>
            <InfoCard icon={Mic} title={t("inI2t")}>
              {t("inI2")}
            </InfoCard>
            <InfoCard icon={BookOpen} title={t("inI3t")}>
              {t("inI3")}
            </InfoCard>
            <InfoCard icon={BarChart3} title={t("inI4t")}>
              {t("inI4")}
            </InfoCard>
            <InfoCard icon={Smartphone} title={t("inI5t")}>
              {t("inI5")}
            </InfoCard>
            <InfoCard icon={WifiOff} title={t("inI6t")}>
              {t("inI6")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("inHow")}>
          <ol className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-4">
            {[
              ["1", t("inS1t"), t("inS1")],
              ["2", t("inS2t"), t("inS2")],
              ["3", t("inS3t"), t("inS3")],
              ["4", t("inS4t"), t("inS4")],
            ].map(([n, st, d]) => (
              <li key={n} className="rounded-2xl border border-border/60 bg-card p-5 shadow-elegant">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display font-bold text-accent-foreground">
                  {n}
                </div>
                <div className="mt-3 font-display font-bold text-foreground">{st}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t("inBack")}>
          <BackingList />
        </Section>

        <Section title={t("inTransp")}>
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• {t("inT1")}</li>
            <li>• {t("inT2")}</li>
            <li>
              • {t("inT3")}
            </li>
          </ul>
        </Section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("inStart")}</h2>
            <p className="mt-3 text-muted-foreground">
              {t("inStartT")}
            </p>
            <div className="mt-6">
              <WhatsAppCta message={MSG}>{t("waWrite")}</WhatsAppCta>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Guaraní Global Tech E.A.S. — RUC 80174299-4</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
