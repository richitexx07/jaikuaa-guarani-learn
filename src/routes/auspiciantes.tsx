import { createFileRoute } from "@tanstack/react-router";
import { usePubTx } from "@/lib/i18n-public";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { BarChart3, CalendarDays, CheckCircle2, GraduationCap, ReceiptText, Zap } from "lucide-react";
import jaiEmbajador from "@/assets/jai/jai-embajador.webp";
import coverPalabra from "@/assets/covers/cover-palabra-del-dia.webp";
import coverAhorcado from "@/assets/covers/cover-ahorcado.webp";
import coverSopa from "@/assets/covers/cover-sopa-de-letras.webp";
import jaiProfe from "@/assets/jai-profe.webp";
import { HeroJai, InfoCard, MarketingHeader, Section, WhatsAppCta } from "@/components/marketing/page-parts";

const MSG = "Hola, me interesa sumar mi marca como auspiciante de Jaikuaa.";

export const Route = createFileRoute("/auspiciantes")({
  head: () => ({
    meta: [
      { title: "Auspiciá Jaikuaa — Tu marca junto al guaraní" },
      {
        name: "description",
        content:
          "Espacios para auspiciantes en Jaikuaa: Palabra del día, juegos, cartel LED del Penal y muro de Auspiciantes Fundadores.",
      },
      { property: "og:title", content: "Auspiciá Jaikuaa" },
      { property: "og:description", content: "Sumá tu marca a la plataforma paraguaya para aprender guaraní." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/auspiciantes" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-auspiciantes.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Auspiciá Jaikuaa" },
      { name: "twitter:description", content: "Sumá tu marca a la plataforma paraguaya para aprender guaraní." },
      { name: "twitter:image", content: "https://www.jaikuaa.com/og-auspiciantes.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/auspiciantes" }],
  }),
  component: AuspiciantesPage,
});

/** Vista de ejemplo de cómo aparece la marca dentro de un juego. */
function GameMock({ img, title, feminine }: { img: string; title: string; feminine?: boolean }) {
  const t = usePubTx();
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background text-center">
      <img src={img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
      <div className="px-3 pt-2 font-display text-lg font-bold text-foreground">{title}</div>
      <p className="mt-1 px-3 pb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {feminine ? t("auPresF") : t("auPresM")} <span className="font-bold text-accent">{t("auYour")}</span>
      </p>
    </div>
  );
}

function SlotCard({ title, children, mock }: { title: string; children: ReactNode; mock: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      {mock}
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function AuspiciantesPage() {
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-8 pb-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <HeroJai src={jaiEmbajador} alt={t("auAlt")} />
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              {t("auBadge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("auTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t("auSub")}
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>{t("auCta")}</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title={t("auWhy")}>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🇵🇾" title={t("auW1t")}>
              {t("auW1")}
            </InfoCard>
            <InfoCard icon={CalendarDays} title={t("auW2t")}>
              {t("auW2")}
            </InfoCard>
            <InfoCard icon={GraduationCap} title={t("auW3t")}>
              {t("auW3")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("auSlots")} intro={t("auSlotsI")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SlotCard title={t("auWord")} mock={<GameMock img={coverPalabra} title={t("auWord")} feminine />}>
              {t("auWordT")}
            </SlotCard>
            <SlotCard
              title={t("auGames")}
              mock={
                <div className="grid gap-2">
                  <GameMock img={coverAhorcado} title={t("auHang")} />
                  <GameMock img={coverSopa} title={t("auSopa")} />
                </div>
              }
            >
              {t("auGamesT")}
            </SlotCard>
            <SlotCard
              title={t("auLed")}
              mock={
                <div className="overflow-hidden rounded-lg bg-neutral-900 px-3 py-4 text-center font-mono text-sm font-bold tracking-widest text-amber-400">
                  {t("auLedMock")}
                </div>
              }
            >
              {t("auLedT")}
            </SlotCard>
            <SlotCard
              title={t("auWall")}
              mock={
                <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-background p-3">
                  {[t("auYour"), t("auFounder"), t("auFounder")].map((n, i) => (
                    <span key={i} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold">
                      {n}
                    </span>
                  ))}
                </div>
              }
            >
              {t("auWallT")}
            </SlotCard>
            <SlotCard title={t("auTrain")} mock={<img src={jaiProfe} alt="" className="mx-auto h-28 w-auto object-contain" loading="lazy" />}>
              {t("auTrainT")}
            </SlotCard>
          </div>
        </Section>

        <Section title={t("auPacks")} intro={t("auPacksI")}>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                key: "Aliado Fundador",
                tag: t("auP1tag"),
                title: t("auP1"),
                items: [t("auP1i0"), t("auP1i1"), t("auP1i2"), t("auMonthly")],
                highlight: true,
              },
              {
                key: "Titular de Juego",
                tag: t("auP2tag"),
                title: t("auP2"),
                items: [t("auP2i0"), t("auP2i1"), t("auP2i2"), t("auMonthly")],
              },
              {
                key: "Amigo de la Cultura",
                tag: t("auP3tag"),
                title: t("auP3"),
                items: [t("auP3i0"), t("auP3i1"), t("auP3i2")],
              },
            ].map((p) => (
              <div
                key={p.key}
                className={`flex flex-col rounded-2xl border bg-card p-6 shadow-elegant ${p.highlight ? "border-accent ring-2 ring-accent/30" : "border-border/60"}`}
              >
                <span className="self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                  {p.tag}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">{p.title}</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{i}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <WhatsAppCta message={`${MSG} Me interesa el paquete ${p.key}.`}>{t("auAsk")}</WhatsAppCta>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("auRes")}>
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard icon={BarChart3} title={t("auR1t")}>
              {t("auR1")}
            </InfoCard>
            <InfoCard icon={ReceiptText} title={t("auR2t")}>
              {t("auR2")}
            </InfoCard>
            <InfoCard icon={Zap} title={t("auR3t")}>
              {t("auR3")}
            </InfoCard>
          </div>
        </Section>

        <Section title={t("auRules")}>
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• {t("auRu1")}</li>
            <li>• {t("auRu2")}</li>
            <li>• {t("auRu3")}</li>
            <li>• {t("auRu4")}</li>
          </ul>
        </Section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("auProg")}</h2>
            <p className="mt-3 text-muted-foreground">
              {t("auProgT")}
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
