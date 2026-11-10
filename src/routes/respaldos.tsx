import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { HeroJai } from "@/components/marketing/page-parts";
import jaiGraduado from "@/assets/jai/jai-graduado.webp";
import { FileText } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/page-parts";
import mecDocumento from "@/assets/respaldos/mec-resolucion-1572-2026.pdf.asset.json";

export const Route = createFileRoute("/respaldos")({
  head: () => ({
    meta: [
      { title: "Respaldos institucionales — Jaikuaa" },
      {
        name: "description",
        content:
          "Declaraciones oficiales de Jaikuaa: interés nacional y educativo por ambas cámaras, interés educativo por el MEC e interés lingüístico por la SPL.",
      },
      { property: "og:title", content: "Respaldos institucionales de Jaikuaa" },
      { property: "og:description", content: "Declaraciones y resoluciones oficiales que respaldan a Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/respaldos" }],
  }),
  component: RespaldosPage,
});

/**
 * Solo respaldos vigentes y comprobables. Convenios en trámite o pilotos sin validar no van acá.
 * Las copias recibidas se enlazan en `pdf`; nuevas fotografías se sirven como documentos desde Lovable Assets.
 */
type Respaldo = { who: string; doc: string; what: string; detail: string; pdf?: string };

const RESPALDOS: Respaldo[] = [
  {
    who: "Honorable Cámara de Senadores",
    doc: "Declaración N.° 547/2026",
    what: "De interés nacional y educativo",
    detail:
      "Dictada en sesión del 26 de agosto de 2026 y remitida por nota MHCS N.° 3867 del 27 de agosto de 2026. Insta al Ministerio de Educación y Ciencias, a la Secretaría de Políticas Lingüísticas y a las instituciones educativas a difundir y aprovechar pedagógicamente la plataforma.",
    pdf: "/respaldos/senado-declaracion-547-2026.pdf",
  },
  {
    who: "Honorable Cámara de Diputados",
    doc: "Declaración N.° 2001",
    what: "De interés nacional y educativo",
    detail:
      "Dada en sesión del 20 de octubre de 2026 y remitida por nota NHCD N.° 5140 del 9 de noviembre de 2026. Insta al Ministerio de Educación y Ciencias, a la Secretaría de Políticas Lingüísticas y a las instituciones educativas a difundir y aprovechar pedagógicamente la plataforma.",
    pdf: "/respaldos/diputados-declaracion-2001-2026.pdf",
  },
  {
    who: "Ministerio de Educación y Ciencias",
    doc: "Resolución N.° 1572/2026",
    what: "De interés educativo",
    detail:
      "Dictada el 9 de noviembre de 2026. Declara de interés educativo el proyecto Jaikuaa, organizado por Guaraní Global Tech E.A.S. Reconoce su aporte como herramienta pedagógica digital para la enseñanza y el aprendizaje de la lengua guaraní; no constituye un software especializado de corrección ortográfica o gramatical.",
    pdf: mecDocumento.url,
  },
  {
    who: "Secretaría de Políticas Lingüísticas",
    doc: "Resolución N.° 116/2026",
    what: "De interés lingüístico",
    detail: "Otorgada el 29 de julio de 2026 por el órgano rector de la política lingüística del Paraguay.",
    pdf: "/respaldos/spl-resolucion-116-2026.pdf",
  },
];

function RespaldosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

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
              <Link to="/comenzar">Empezar gratis</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
