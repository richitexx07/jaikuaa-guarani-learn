import { createFileRoute } from "@tanstack/react-router";
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
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="px-4 pt-8 pb-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <HeroJai src={jaiAtencion} alt="Jai, de saco y corbata, listo para atender" />
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Para instituciones
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Que tu equipo atienda también en guaraní
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Un plan piloto de 12 semanas, sin costo, para que funcionarios y técnicos fortalezcan su guaraní oral y
              escrito con una herramienta hecha en Paraguay.
            </p>
            <div className="mt-8">
              <WhatsAppCta message={MSG}>Pedir un piloto por WhatsApp</WhatsAppCta>
            </div>
          </div>
        </section>

        <Section title="Por qué importa">
          <div className="grid gap-5 sm:grid-cols-3">
            <InfoCard icon={MessagesSquare} title="Es la lengua de la gente">
              El 66,9 % de la población habla guaraní (Encuesta Permanente de Hogares Continua 2022, INE). Muchas
              personas entienden mejor un trámite, una indicación o un aviso en su idioma.
            </InfoCard>
            <InfoCard icon={Scale} title="Lo pide la ley">
              La Ley N.° 4.251/10 de Lenguas establece que las dos lenguas oficiales tienen vigencia y uso en todas las
              instituciones públicas (Art. 3).
            </InfoCard>
            <InfoCard icon={Handshake} title="Mejor atención">
              Un funcionario que se comunica bien en guaraní genera confianza y evita malentendidos con quienes atiende.
            </InfoCard>
          </div>
        </Section>

        <Section title="Qué incluye el piloto" intro="Sin costo para la institución durante las 12 semanas.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={KeyRound} title="Acceso con código propio">
              Todos los participantes entran con el código de su institución, desde el celular o la computadora.
            </InfoCard>
            <InfoCard icon={Mic} title="Lecciones con voz humana">
              Contenido en revisión por docentes especialistas y audios grabados por hablantes paraguayos.
            </InfoCard>
            <InfoCard icon={BookOpen} title="Vocabulario de tu área">
              La institución aporta sus términos técnicos y los especialistas elaboran y validan su versión en guaraní
              antes de publicarla: salud, agro, atención al público, jurídico y más.
            </InfoCard>
            <InfoCard icon={BarChart3} title="Panel de seguimiento">
              Quién participa, cuánto avanza cada persona, informe mensual e informe final de resultados.
            </InfoCard>
            <InfoCard icon={Smartphone} title="App en el celular">
              Jaikuaa se instala en la pantalla del teléfono y se abre como una aplicación.
            </InfoCard>
            <InfoCard icon={WifiOff} title="Uso sin conexión">
              Las lecciones y audios que ya abriste quedan guardados en el teléfono para estudiar donde no hay señal; el
              avance se sincroniza al volver la conexión.
            </InfoCard>
          </div>
        </Section>

        <Section title="Cómo funciona">
          <ol className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-4">
            {[
              ["1", "Conversamos", "Definimos el grupo (sugerimos de 20 a 40 personas) y un referente de la institución."],
              ["2", "Arrancamos", "Encuentro de inicio, registro de participantes y entrega del código de ingreso."],
              ["3", "12 semanas", "Estudio a ritmo propio, vocabulario del área e informes de avance."],
              ["4", "Resultados", "Informe final. Si funciona, el siguiente paso es un convenio de cooperación."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl border border-border/60 bg-card p-5 shadow-elegant">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display font-bold text-accent-foreground">
                  {n}
                </div>
                <div className="mt-3 font-display font-bold text-foreground">{t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Respaldo institucional">
          <BackingList />
        </Section>

        <Section title="Con total transparencia">
          <ul className="mx-auto max-w-3xl space-y-3 text-muted-foreground">
            <li>• Jaikuaa no es un traductor automático ni reemplaza al docente: es una herramienta de apoyo.</li>
            <li>• Ningún contenido en guaraní se publica sin la revisión de especialistas en la lengua.</li>
            <li>
              • Cualquier adquisición futura de una institución pública se hace solo por los procedimientos de la Ley
              N.° 7.021/2022 de Suministro y Contrataciones Públicas.
            </li>
          </ul>
        </Section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">¿Empezamos?</h2>
            <p className="mt-3 text-muted-foreground">
              Escribinos y coordinamos una demostración para tu institución.
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
