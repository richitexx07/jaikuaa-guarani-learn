import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { HeroJai } from "@/components/marketing/page-parts";
import jaiGraduado from "@/assets/jai/jai-graduado.webp";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/respaldos")({
  head: () => ({
    meta: [
      { title: "Respaldos institucionales — Jaikuaa" },
      {
        name: "description",
        content:
          "Jaikuaa fue declarada de interés nacional y educativo por el Senado y la Cámara de Diputados, y de interés lingüístico por la Secretaría de Políticas Lingüísticas.",
      },
      { property: "og:title", content: "Respaldos institucionales de Jaikuaa" },
      { property: "og:description", content: "Declaraciones y resoluciones oficiales que respaldan a Jaikuaa." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/respaldos" }],
  }),
  component: RespaldosPage,
});

/**
 * Solo respaldos vigentes y comprobables. Convenios en trámite o pilotos sin validar no van acá.
 * Cuando llegue la copia oficial de un documento, se guarda en public/respaldos y se completa `pdf`.
 */
type Respaldo = { who: string; doc: string; what: string; detail: string; pdf?: string };

const RESPALDOS: Respaldo[] = [
  {
    who: "Honorable Cámara de Senadores",
    doc: "Declaración N.° 547/2026",
    what: "De interés nacional y educativo",
    detail:
      "Dictada en sesión del 26 de agosto de 2026. Insta al Ministerio de Educación y Ciencias, a la Secretaría de Políticas Lingüísticas y a las instituciones educativas a difundir y aprovechar pedagógicamente la plataforma.",
    pdf: "/respaldos/senado-declaracion-547-2026.pdf",
  },
  {
    who: "Honorable Cámara de Diputados",
    doc: "Declaración N.° 2001",
    what: "De interés nacional y educativo",
    detail: "Aprobada por la Cámara de Diputados en octubre de 2026.",
  },
  {
    who: "Secretaría de Políticas Lingüísticas",
    doc: "Resolución N.° 116/2026",
    what: "De interés lingüístico",
    detail: "Otorgada por el órgano rector de la política lingüística del Paraguay.",
  },
];

function RespaldosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <HeroJai src={jaiGraduado} alt="Jai con birrete y diploma" />
          <h1 className="text-center font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Respaldos institucionales
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
            Jaikuaa cuenta con el reconocimiento de estas instituciones del Paraguay. Cada respaldo tiene su número
            oficial para que puedas comprobarlo.
          </p>

          <ul className="mt-12 space-y-5">
            {RESPALDOS.map((r) => (
              <li key={r.doc} className="rounded-2xl border border-primary/20 bg-card p-6 shadow-elegant sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{r.what}</p>
                <h2 className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl">{r.who}</h2>
                <p className="mt-1 font-medium text-foreground">{r.doc}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                {r.pdf ? (
                  <Button variant="outline" size="sm" className="mt-5" asChild>
                    <a href={r.pdf} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" aria-hidden /> Ver el documento
                    </a>
                  </Button>
                ) : (
                  <p className="mt-5 text-xs text-muted-foreground">La copia oficial se publica aquí apenas la recibamos.</p>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            No vendemos tus datos ni los compartimos con terceros para publicidad.{" "}
            <Link to="/privacidad" className="font-medium text-accent hover:underline">
              Política de privacidad
            </Link>
          </p>

          <div className="mt-8 flex justify-center">
            <Button variant="cta" size="lg" asChild>
              <Link to="/comenzar">Empezar — Libre acceso</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
