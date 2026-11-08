import { createFileRoute, Link } from "@tanstack/react-router";
import { usePubTx } from "@/lib/i18n-public";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Gamepad2, Gift, Home, Mic, type LucideIcon } from "lucide-react";
import { HeroJai } from "@/components/marketing/page-parts";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiFesteja from "@/assets/jai/jai-trofeo.webp";
import { Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/page-parts";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Jaikuaa — Nuestra misión" },
      { name: "description", content: "Jaikuaa es una plataforma paraguaya para aprender guaraní, con voz humana real y hecha íntegramente en Paraguay." },
      { property: "og:title", content: "Sobre Jaikuaa" },
      { property: "og:description", content: "Conozcamos juntos. Una plataforma paraguaya para aprender guaraní, con voz humana real." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        {/* Título e intro */}
        <section className="px-4 pt-8 pb-12 sm:px-6 sm:pt-16 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <HeroJai src={jaiSaluda} alt={t("soAlt")} />
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t("soTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("soIntro")}
            </p>
          </div>
        </section>

        {/* Nuestra misión */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                {t("soMission")}
              </span>
              <p className="mt-5 text-lg leading-relaxed text-foreground sm:text-xl">
                {t("soMissionText")}
              </p>
            </div>
          </div>
        </section>

        {/* Qué nos hace diferentes */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              {t("soDiff")}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <ValueCard icon={Mic} title={t("soV1t")}>
                {t("soV1")}
              </ValueCard>
              <ValueCard icon={Home} title={t("soV2t")}>
                {t("soV2")}
              </ValueCard>
              <ValueCard icon={CheckCircle2} title={t("soV3t")}>
                {t("soV3")}
              </ValueCard>
              <ValueCard icon={Gamepad2} title={t("soV4t")}>
                {t("soV4")}
              </ValueCard>
              <ValueCard icon={Gift} title={t("soV5t")}>
                {t("soV5")}
              </ValueCard>
            </div>
          </div>
        </section>

        {/* Nuestro compromiso con las instituciones */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {t("soCommit")}
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-foreground sm:text-3xl">
                {t("soInst")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {t("soInstText")}
              </p>
            </div>
          </div>
        </section>

        {/* Datos del proyecto */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              {t("soData")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FactCard label={t("soMark")} value={t("soMarkV")} />
              <FactCard label={t("soDev")} value={t("soMade")} />
              <FactCard label={t("soSite")} value="jaikuaa.com" />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {t("soContact")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("soContactText")}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button variant="cta" size="lg" asChild>
                  <a href="mailto:contacto@jaikuaa.com">
                    <Mail className="h-4 w-4" />
                    contacto@jaikuaa.com
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/">{t("backHome")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cierre destacado */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <img src={jaiFesteja} alt="" className="mx-auto mb-4 h-32 w-auto object-contain" loading="lazy" />
            <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t("soClose")}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ValueCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant card-hover">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary" aria-hidden>
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
