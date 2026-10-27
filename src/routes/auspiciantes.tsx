import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { BarChart3, CalendarDays, CheckCircle2, GraduationCap, ReceiptText, Zap } from "lucide-react";
import jaiEmbajador from "@/assets/jai/jai-embajador.webp";
import coverPalabra from "@/assets/covers/cover-palabra-del-dia.webp";
import coverAhorcado from "@/assets/covers/cover-ahorcado.webp";
import coverSopa from "@/assets/covers/cover-sopa-de-letras.webp";
import jaiTrofeo from "@/assets/jai/jai-trofeo.webp";
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
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background text-center">
      <img src={img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
      <div className="px-3 pt-2 font-display text-lg font-bold text-foreground">{title}</div>
      <p className="mt-1 px-3 pb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {feminine ? "Presentada por" : "Presentado por"} <span className="font-bold text-accent">Tu marca</span>
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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-8 pb-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <HeroJai src={jaiEmbajador} alt="Jai con un megáfono" />
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Para auspiciantes
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Tu marca, junto al guaraní
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Jaikuaa es gratis para los paraguayos gracias a las empresas que lo acompañan. Sumá tu marca a una causa
              de identidad nacional, en los espacios que la gente usa todos los días.
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>Quiero ser auspiciante</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title="Por qué auspiciar Jaikuaa">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard emoji="🇵🇾" title="Identidad nacional">
              Un proyecto declarado de Interés Nacional y Educativo por el Senado (Declaración N.° 547/2026) y de
              interés lingüístico por la Secretaría de Políticas Lingüísticas (Resolución N.° 116/2026).
            </InfoCard>
            <InfoCard icon={CalendarDays} title="Presencia diaria">
              La Palabra del día y los juegos son lo que los usuarios abren todos los días. Tu marca acompaña ese hábito.
            </InfoCard>
            <InfoCard icon={GraduationCap} title="Asociación positiva">
              Tu marca queda unida a la educación y al orgullo por nuestra lengua, no a una publicidad que interrumpe.
            </InfoCard>
          </div>
        </Section>

        <Section title="Espacios disponibles" intro="Así aparece tu marca dentro de la plataforma.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SlotCard title="Palabra del día" mock={<GameMock img={coverPalabra} title="Palabra del día" feminine />}>
              Una palabra guaraní por día, con audio humano. El espacio más visitado de la plataforma.
            </SlotCard>
            <SlotCard
              title="Juegos educativos"
              mock={
                <div className="grid gap-2">
                  <GameMock img={coverAhorcado} title="Ahorcado con chipas" />
                  <GameMock img={coverSopa} title="Sopa de letras" />
                </div>
              }
            >
              Un auspiciante por juego: Ahorcado, Sopa de letras, Memoria y Penales. Tu marca se ve durante toda la
              partida.
            </SlotCard>
            <SlotCard
              title="Cartel LED del Penal"
              mock={
                <div className="overflow-hidden rounded-lg bg-neutral-900 px-3 py-4 text-center font-mono text-sm font-bold tracking-widest text-amber-400">
                  TU MARCA AQUÍ
                </div>
              }
            >
              El cartel del estadio del juego de Penales muestra el mensaje de tu marca en cada tiro.
            </SlotCard>
            <SlotCard
              title="Muro de Auspiciantes Fundadores"
              mock={
                <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-background p-3">
                  {["Tu marca", "Fundador", "Fundador"].map((n, i) => (
                    <span key={i} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold">
                      {n}
                    </span>
                  ))}
                </div>
              }
            >
              Las primeras empresas que acompañan el lanzamiento quedan en la portada de jaikuaa.com.
            </SlotCard>
            <SlotCard title="Premios para quienes más aprenden" mock={<img src={jaiTrofeo} alt="" className="mx-auto h-28 w-auto object-contain" loading="lazy" />}>
              Vales, descuentos o productos de tu marca para los usuarios más constantes. En preparación, conforme a
              las autorizaciones que correspondan.
            </SlotCard>
            <SlotCard title="Capacitación de tu personal" mock={<img src={jaiProfe} alt="" className="mx-auto h-28 w-auto object-contain" loading="lazy" />}>
              Guaraní para tu equipo de atención al cliente, con vocabulario de tu rubro revisado por docentes especialistas.
            </SlotCard>
          </div>
        </Section>

        <Section title="Paquetes" intro="Pocos espacios, un solo auspiciante por rubro. Precios a convenir según el espacio.">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                tag: "Exclusivo",
                title: "Aliado Fundador",
                items: ["Palabra del día", "Muro de Fundadores en la portada", "Mención en presentaciones institucionales", "Informe mensual"],
                highlight: true,
              },
              {
                tag: "Por juego",
                title: "Titular de Juego",
                items: ["Un juego a elección", "«Presentado por» en cada partida", "Cartel LED si elegís Penales", "Informe mensual"],
              },
              {
                tag: "Institucional",
                title: "Amigo de la Cultura",
                items: ["Mención en la página de aliados", "Uso del sello «Aliado de Jaikuaa» en tu comunicación", "Informe trimestral"],
              },
            ].map((p) => (
              <div
                key={p.title}
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
                  <WhatsAppCta message={`${MSG} Me interesa el paquete ${p.title}.`}>Consultar</WhatsAppCta>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Resultados medibles">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard icon={BarChart3} title="Vistas reales">
              Contamos cada vez que tu marca se muestra, una vez por persona por día: sin cifras infladas.
            </InfoCard>
            <InfoCard icon={ReceiptText} title="Informe imprimible">
              Recibís un informe con vistas y personas alcanzadas por espacio, listo para tu área de marketing o RSE.
            </InfoCard>
            <InfoCard icon={Zap} title="Sin frenar la app">
              Tu marca carga al instante, también con poca señal, porque es parte de la plataforma.
            </InfoCard>
          </div>
        </Section>

        <Section title="Reglas claras">
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• Exclusividad por rubro: un solo banco, una sola telefonía, un solo supermercado.</li>
            <li>• No aceptamos marcas de apuestas, alcohol ni tabaco: en Jaikuaa también aprenden estudiantes.</li>
            <li>• Ninguna publicidad interrumpe una lección.</li>
            <li>• Las marcas no intervienen en el contenido en guaraní: lo elaboran y validan especialistas en la lengua.</li>
          </ul>
        </Section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Programa Auspiciantes Fundadores</h2>
            <p className="mt-3 text-muted-foreground">
              Un grupo reducido de empresas paraguayas que acompañan el lanzamiento de Jaikuaa. Conversemos sobre el
              espacio que mejor se ajusta a tu marca.
            </p>
            <div className="mt-6">
              <WhatsAppCta message={MSG}>Escribir por WhatsApp</WhatsAppCta>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Guaraní Global Tech E.A.S. — RUC 80174299-4</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
