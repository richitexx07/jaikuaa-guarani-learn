import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad — Jaikuaa" },
      { name: "description", content: "Cómo Jaikuaa cuida y protege tus datos personales." },
      { property: "og:title", content: "Política de Privacidad — Jaikuaa" },
      { property: "og:description", content: "Cómo Jaikuaa recoge, utiliza y protege tu información personal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/privacidad" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/privacidad" }],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LegalHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="text-sm text-muted-foreground">Última actualización: junio de 2026</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            En Jaikuaa cuidamos tu información con respeto y transparencia. Esta política explica, en lenguaje claro, qué datos recogemos y cómo los usamos.
          </p>

          <Section title="1. Qué datos recogemos">
            <p>Cuando creás una cuenta, guardamos los datos que vos mismo/a nos brindás:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Tu nombre</li>
              <li>Tu correo electrónico</li>
              <li>Tu contraseña (almacenada de forma segura y encriptada — nadie del equipo puede verla)</li>
              <li>Tu progreso de aprendizaje (lecciones completadas, XP, racha)</li>
            </ul>
          </Section>

          <Section title="2. Para qué usamos tus datos">
            <p>Usamos tu información únicamente para:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Permitirte iniciar sesión y guardar tu progreso</li>
              <li>Personalizar y mejorar tu experiencia de aprendizaje</li>
              <li>Comunicarte cosas importantes sobre tu cuenta (por ejemplo, recuperación de contraseña)</li>
            </ul>
          </Section>

          <Section title="3. Qué NO hacemos con tus datos">
            <ul className="ml-6 list-disc space-y-1">
              <li><strong>No vendemos</strong> tu información personal a nadie.</li>
              <li><strong>No compartimos</strong> tus datos con terceros con fines publicitarios.</li>
              <li>No usamos tu información para enviarte publicidad invasiva.</li>
            </ul>
          </Section>

          <Section title="4. Seguridad">
            <p>
              Tu contraseña se guarda de forma segura, encriptada con estándares de la industria. Usamos conexiones cifradas (HTTPS) para proteger la información que viaja entre tu dispositivo y nuestros servidores. Ningún sistema es 100% infalible, pero trabajamos seriamente para mantener tu cuenta segura.
            </p>
          </Section>

          <Section title="5. Tus derechos">
            <p>
              Podés pedirnos en cualquier momento acceder, corregir o eliminar tus datos personales. Escribinos para coordinarlo y respondemos lo antes posible.
            </p>
          </Section>

          <Section title="6. Cambios a esta política">
            <p>
              Si actualizamos esta política, te avisaremos dentro de la app o por correo. La fecha de "última actualización" arriba siempre indica la versión vigente.
            </p>
          </Section>

          <p className="mt-10 text-sm text-muted-foreground">
            ¿Tenés dudas sobre tu privacidad? Escribinos y con gusto te respondemos.
          </p>
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

function LegalHeader() {
  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <BrandLogo />
        </Link>
      </div>
    </header>
  );
}
