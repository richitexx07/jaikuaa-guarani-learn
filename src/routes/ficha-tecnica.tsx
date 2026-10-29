import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Printer,
  Layers,
  ShieldCheck,
  WifiOff,
  Cpu,
  Landmark,
  Globe,
  Code2,
  Database,
  FlaskConical,
  GitBranch,
  Route as RouteIcon,
  Server,
} from "lucide-react";
import { PrivateGate } from "@/components/private-gate";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/ficha-tecnica")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Ficha técnica de arquitectura — Jaikuaa" },
      {
        name: "description",
        content: "Ficha técnica de arquitectura, seguridad e infraestructura de la plataforma Jaikuaa para revisión técnica.",
      },
      { property: "og:title", content: "Ficha técnica de arquitectura — Jaikuaa" },
      { property: "og:description", content: "Arquitectura, seguridad, operación sin conexión y métricas reales del código." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: () => (
    <PrivateGate>
      <FichaTecnica />
    </PrivateGate>
  ),
});

/** Cifras medidas sobre el repositorio el 27/10/2026. Actualizar a mano al re-medir. */
const METRICAS = [
  { icon: Code2, valor: "54.500+", label: "líneas de TypeScript" },
  { icon: RouteIcon, valor: "81", label: "pantallas y rutas" },
  { icon: Database, valor: "30", label: "tablas con seguridad por fila" },
  { icon: FlaskConical, valor: "506", label: "pruebas automáticas, todas OK" },
  { icon: Server, valor: "27", label: "módulos de funciones de servidor" },
  { icon: GitBranch, valor: "967", label: "versiones registradas en Git" },
] as const;

const SECCIONES = [
  {
    icon: Layers,
    titulo: "Stack tecnológico",
    items: [
      "TanStack Start v1 sobre React 19 y Vite 7: renderizado en servidor e hidratación en el cliente, con rutas tipadas de punta a punta.",
      "TypeScript estricto en todo el código de la aplicación.",
      "Ejecución en el borde de red (Cloudflare Workers / workerd): sin servidores dedicados que mantener ni pagar en horas sin tráfico.",
      "Tailwind CSS v4 con tokens de diseño semánticos y componentes accesibles (Radix / shadcn).",
      "Base de datos PostgreSQL gestionada, autenticación con correo y Google, y almacenamiento de archivos para los audios.",
    ],
  },
  {
    icon: ShieldCheck,
    titulo: "Seguridad",
    items: [
      "Seguridad por fila (RLS) activa en cada tabla: ninguna persona puede leer ni modificar datos de otra.",
      "Roles en una tabla separada y verificados en el servidor (has_role); nunca a partir de datos que el usuario pueda editar.",
      "Escrituras sensibles (validación, certificados, aulas, publicación) solo por funciones de servidor con verificación de sesión.",
      "Doble firma humana: quien propone una palabra no puede ser quien la valida (control en servidor y restricción en la base).",
      "Certificados con código aleatorio, verificables en una página pública que muestra solo los datos impresos.",
      "Escaneos de seguridad antes de cada publicación. Juegos sin chat libre, pensados para menores.",
      "Certificados: el servidor exige lecciones publicadas, hechas en orden y con un tope diario antes de contarlas. Planillas descargadas protegidas contra fórmulas. Docentes sin habilitación vigente pierden acceso a sus aulas.",
    ],
  },
  {
    icon: WifiOff,
    titulo: "Operación sin conexión",
    items: [
      "Aplicación instalable (PWA) en Android, iPhone y computadora.",
      "Descarga opcional de lecciones y audios para usar en modo avión.",
      "Colas locales: respuestas y avances hechos sin señal se envían solos al volver la conexión, sin perder datos.",
      "Pensado para escuelas y zonas rurales con conectividad limitada.",
    ],
  },
  {
    icon: Cpu,
    titulo: "Activo lingüístico y motor",
    items: [
      "Corpus único compartido entre grados (sin duplicados), organizado por grado escolar.",
      "Audio exclusivamente de grabaciones humanas; sin voces sintéticas.",
      "Motor morfológico HFST (autómatas de estados finitos) desarrollado aparte por el CTO. En desarrollo, todavía no conectado.",
      "Principio de diseño: el motor opina, los docentes deciden. Ningún contenido en guaraní se publica sin validación humana.",
      "Traductor y tutor automáticos apagados a propósito hasta contar con validación.",
    ],
  },
  {
    icon: Globe,
    titulo: "Alcance internacional",
    items: [
      "Portadas propias en nueve idiomas: castellano, portugués (/pt), inglés (/en), alemán (/de), francés (/fr), chino tradicional (/zh), japonés (/ja), ruso (/ru) y coreano (/ko), pensadas para inversores, diplomacia, turismo y extranjeros que viven o hacen negocios en Paraguay.",
      "Selector de idioma en la portada, en el ingreso y dentro de la app: se puede cambiar en cualquier momento y la elección queda recordada en el dispositivo.",
      "Interfaz completa en los seis idiomas: ingreso, panel, curso y lecciones, logros, ranking, glosario, certificado, embajadores, trivia, agro, guaraní escolar, páginas públicas y los 16 juegos (reglas, botones y resultados).",
      "El contenido en guaraní no se traduce automáticamente: significados, preguntas y notas culturales siguen en castellano con el aviso «En validación» hasta que lo revisen especialistas. Alemán, francés y chino son traducciones preliminares, pendientes de revisión nativa.",
      "Privacidad y Términos: el castellano es la versión oficial; en otros idiomas se muestra un aviso.",
      "Posicionamiento en buscadores por idioma: cada portada tiene su propio título, descripción y enlaces alternos (hreflang).",
      "Base para el modelo comercial: el guaraní es gratis para paraguayos; el público internacional es el segmento pago.",
    ],
  },
  {
    icon: Globe,
    titulo: "Modelo de negocio",
    items: [
      "Guaraní básico gratis para todos los paraguayos. Pagan especializaciones, instituciones, auspiciantes y el público extranjero.",
      "Público internacional: con la app en seis idiomas, cursos y certificados para extranjeros se vuelven el segmento pago principal. Cobro internacional: pendiente de integrar la pasarela de pagos.",
      "Instituciones y empresas: grupos, aulas y encargos de vocabulario por rubro (por ejemplo, agro), con revisión pagada a docentes especialistas.",
      "Auspiciantes: espacios nativos dentro de juegos y desafíos, con informe de impresiones. Sin sorteos ni premios hasta tener los permisos.",
      "Industrias culturales: asesoría lingüística para producciones audiovisuales, editoriales y turismo receptivo, junto con especialistas en la lengua.",
      "Embajadores: programa de referidos para que la comunidad comparta la plataforma; el esquema de incentivo está en definición.",
    ],
  },
] as const;

const RESPALDOS = [
  "Honorable Cámara de Senadores — Declaración 547/2026.",
  "Honorable Cámara de Diputados — Declaración N.° 2001 (Exp. 95904).",
  "Secretaría de Políticas Lingüísticas — Resolución 116/2026.",
  "Marca ante la DINAPI: en trámite — Solicitud N.° 2658897.",
  "Jaikuaa desarrolla un plan piloto con el Ateneo de Lengua y Cultura Guaraní (convenio del 25/09/2026).",
] as const;

function FichaTecnica() {
  return (
    <div className="min-h-dvh bg-muted/60 px-3 py-5 print:bg-transparent print:p-0 sm:px-6 sm:py-8">
      <main className="mx-auto max-w-4xl rounded-2xl border border-border bg-card px-5 py-7 pb-16 text-foreground shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-6 print:shadow-none sm:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al panel
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Vista privada. Guardala como PDF para enviarla.</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
            >
              <Printer className="h-4 w-4" aria-hidden /> Descargar PDF
            </button>
          </div>
        </div>

        <header className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground print:break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="rounded-xl bg-primary-foreground/95 p-1.5">
              <BrandLogo />
            </div>
            <span className="rounded-full border border-primary-foreground/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
              Due diligence técnico · Octubre 2026
            </span>
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Ficha técnica de arquitectura e infraestructura
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">
            Plataforma educativa para aprender guaraní con voces reales, juegos y certificados verificables. En producción en www.jaikuaa.com.
          </p>
          <div className="mt-5 flex h-1.5 w-40 overflow-hidden rounded-full">
            <span className="flex-1 bg-secondary" />
            <span className="flex-1 bg-primary-foreground" />
            <span className="flex-1 bg-accent" />
          </div>
        </header>

        <dl className="mt-6 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline font-semibold">Titular: </dt><dd className="inline text-muted-foreground">Guaraní Global Tech E.A.S. (RUC 80174299-4)</dd></div>
          <div><dt className="inline font-semibold">Presidente: </dt><dd className="inline text-muted-foreground">Richard Ávalos Arriola</dd></div>
          <div><dt className="inline font-semibold">CTO: </dt><dd className="inline text-muted-foreground">Alan Ávalos</dd></div>
          <div><dt className="inline font-semibold">Marca: </dt><dd className="inline text-muted-foreground">DINAPI, en trámite — Solicitud N.° 2658897</dd></div>
        </dl>

        <section className="mt-8 print:break-inside-avoid">
          <h2 className="font-display text-lg font-bold">Métricas del repositorio</h2>
          <p className="text-xs text-muted-foreground">Medidas sobre el código el 27/10/2026.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRICAS.map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-background p-4">
                <m.icon className="h-5 w-5 text-accent" aria-hidden />
                <p className="mt-2 font-display text-2xl font-bold text-primary">{m.valor}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {SECCIONES.map((s) => (
            <section key={s.titulo} className="rounded-xl border border-border p-5 print:break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <h2 className="font-display text-lg font-bold">{s.titulo}</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {s.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border-l-4 border-accent bg-muted/50 p-5 print:break-inside-avoid">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-bold">Respaldo institucional</h2>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {RESPALDOS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          Documento informativo para revisión técnica. Lo marcado «en desarrollo» todavía no está en producción. Contacto: Richard Ávalos Arriola · WhatsApp 0982 418 732 · richitexx07@gmail.com
        </footer>
      </main>
    </div>
  );
}
