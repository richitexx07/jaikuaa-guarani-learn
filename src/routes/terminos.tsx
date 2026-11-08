import { createFileRoute, Link } from "@tanstack/react-router";
import { usePubTx } from "@/lib/i18n-public";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — Jaikuaa" },
      { name: "description", content: "Términos de uso de la plataforma Jaikuaa." },
      { property: "og:title", content: "Términos y Condiciones — Jaikuaa" },
      { property: "og:description", content: "Condiciones de uso, cuentas y contenido educativo de Jaikuaa." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/terminos" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/terminos" }],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  const t = usePubTx();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          {t("legalNote") && <p className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{t("legalNote")}</p>}
          <p className="text-sm text-muted-foreground">Última actualización: junio de 2026</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Bienvenido/a a Jaikuaa. Al usar nuestra plataforma aceptás estos términos. Los escribimos en lenguaje sencillo para que sean fáciles de entender.
          </p>

          <Section title="1. Qué es Jaikuaa">
            <p>
              Jaikuaa es una plataforma educativa paraguaya para aprender guaraní. Ofrecemos lecciones, ejercicios, herramientas de práctica y contenido cultural.
            </p>
          </Section>

          <Section title="2. Tu cuenta">
            <ul className="ml-6 list-disc space-y-1">
              <li>Para usar Jaikuaa necesitás crear una cuenta con información real y vigente.</li>
              <li>Sos responsable de mantener tu contraseña segura y de la actividad realizada desde tu cuenta.</li>
              <li>Si sospechás un uso no autorizado, avisanos lo antes posible.</li>
            </ul>
          </Section>

          <Section title="3. Uso correcto de la plataforma">
            <p>Al usar Jaikuaa te comprometés a:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Respetar a otros usuarios y al equipo.</li>
              <li>No subir contenido ofensivo, discriminatorio o ilegal.</li>
              <li>No intentar dañar, interrumpir o vulnerar la plataforma ni sus contenidos.</li>
              <li>No usar Jaikuaa para fines comerciales sin nuestro permiso.</li>
            </ul>
          </Section>

          <Section title="4. Contenido educativo">
            <p>
              Los contenidos de Jaikuaa (lecciones, textos, imágenes, audios) son propiedad de Jaikuaa o se usan con autorización. Podés usarlos para tu aprendizaje personal; copiarlos o redistribuirlos sin permiso no está permitido.
            </p>
          </Section>

          <Section title="5. Funciones gratuitas y Premium">
            <p>
              Algunas funciones son gratuitas y otras pueden requerir una suscripción Premium. Las condiciones de pago, renovación y cancelación se mostrarán de forma clara antes de cualquier cobro.
            </p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>
              Trabajamos para mantener Jaikuaa disponible y funcionando bien, pero no podemos garantizar que esté libre de interrupciones o errores en todo momento. Hacemos mejoras y mantenimiento de forma continua.
            </p>
          </Section>

          <Section title="7. Cierre de cuenta">
            <p>
              Podés cerrar tu cuenta cuando quieras. También podemos suspender o cerrar cuentas que incumplan estos términos, siempre con un aviso justo cuando sea posible.
            </p>
          </Section>

          <Section title="8. Cambios a los términos">
            <p>
              Si actualizamos estos términos, te avisaremos dentro de la app. La fecha arriba indica la versión vigente.
            </p>
          </Section>

          <Section title="9. Ley aplicable">
            <p>
              Estos términos se rigen por las leyes de la República del Paraguay.
            </p>
          </Section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
