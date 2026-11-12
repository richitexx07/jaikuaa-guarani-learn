import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenText, FileSignature, Handshake, Loader2, MapPin, MessageCircle, Mic2, Music2, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { Nanduti } from "@/components/libreria/arte";
import { FotoArtista, PH } from "@/components/purahei/partes";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { vitrinaPurahei } from "@/lib/purahei.functions";
import { NOMBRE_ESTILO } from "@/lib/purahei";

export const Route = createFileRoute("/purahei/")({
  head: () => ({
    meta: [
      { title: "Purahéi Jaikuaa — Vitrina de artistas y cantores paraguayos" },
      { name: "description", content: "Escuchá a artistas paraguayos con su voz real, leé sus letras en guaraní y castellano, y cantalas en Purahéi Karaoke. Para contratarlos, les escribís directo." },
      { property: "og:title", content: "Purahéi Jaikuaa — La música paraguaya, para aprender y cantar" },
      { property: "og:description", content: "La vitrina de artistas y cantores paraguayos de Jaikuaa: letras bilingües, voz real y contacto directo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/purahei" }],
  }),
  component: VitrinaPage,
});

const PASOS = [
  { icon: FileSignature, t: "Firmás en línea", d: "Llenás tus datos, marcás qué autorizás y firmás con tu correo confirmado. Sin imprimir nada." },
  { icon: Handshake, t: "Te queda tu constancia", d: "Con un código que cualquiera puede verificar. Podés pedir el retiro cuando quieras." },
  { icon: ShieldCheck, t: "Docentes revisan la letra", d: "Tu letra en guaraní y su traducción las revisan docentes especialistas." },
  { icon: Mic2, t: "Salís a la vitrina", d: "Tu ficha, tu voz y tu canción en el karaoke, con tu WhatsApp para que te contraten directo." },
];

function VitrinaPage() {
  const cargar = useServerFn(vitrinaPurahei);
  const { data, isLoading } = useQuery({ queryKey: ["purahei-vitrina"], queryFn: () => cargar() });
  const artistas = data?.artistas ?? [];
  const sumarme = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Mba'éichapa. Soy artista y tengo una consulta sobre Purahéi Jaikuaa.")}`;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden text-white" style={{ background: `radial-gradient(120% 90% at 80% 0%, #2B527F 0%, ${PH.marino} 45%, ${PH.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-25" />
          <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><Music2 className="h-4 w-4" aria-hidden /> Vitrina musical y cultural</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">Purahéi Jaikuaa</h1>
            <p className="mt-3 max-w-xl text-lg text-white/85">
              Artistas y cantores paraguayos con su voz real. Leé sus letras en guaraní y castellano, cantalas en el karaoke y, si querés contratarlos, escribiles directo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#artistas" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-display font-bold" style={{ background: PH.dorado, color: PH.noche }}>Ver artistas</a>
              <Link to="/juegos/karaoke" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-display font-bold ring-1 ring-white/40">Ir a Purahéi Karaoke</Link>
            </div>
          </div>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${PH.rojo} 0 33%, #FFFFFF 33% 66%, #0038A8 66%)` }} aria-hidden />
        </section>

        <section id="artistas" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-10 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Artistas</h2>
          {isLoading ? (
            <p className="mt-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando la vitrina…</p>
          ) : artistas.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
              <Mic2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
              <p className="mt-3 font-display text-xl font-bold">Sé de los primeros artistas de Purahéi</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Estamos sumando a los primeros músicos. Cada canción sale con el permiso de sus dueños y la letra revisada por docentes especialistas.</p>
              <Link to="/convenio/$programa" params={{ programa: "purahei" }} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold" style={{ background: PH.dorado, color: PH.noche }}>
                <FileSignature className="h-5 w-5" aria-hidden /> Soy artista: quiero sumarme
              </Link>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {artistas.map((a) => (
                <li key={a.id}>
                  <Link to="/purahei/$slug" params={{ slug: a.slug }} className="group block overflow-hidden rounded-3xl bg-card shadow-elegant ring-1 ring-border transition active:scale-[.99]">
                    <FotoArtista src={a.foto} nombre={a.nombre} className="aspect-[4/5] w-full transition group-hover:scale-[1.02]" />
                    <div className="p-3">
                      <p className="line-clamp-2 font-display text-lg font-bold leading-tight text-foreground">{a.nombre}</p>
                      {a.ciudad && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden /> {a.ciudad}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.obras} {a.obras === 1 ? "obra" : "obras"}{a.estilos.length ? ` · ${a.estilos.map((e) => NOMBRE_ESTILO[e as keyof typeof NOMBRE_ESTILO] ?? e).join(", ")}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-muted/40">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">¿Sos artista o representás a uno?</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Tu música llega a estudiantes de guaraní y a paraguayos en todo el mundo. Vos decidís qué se comparte, y quien quiera contratarte te escribe directo.</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {PASOS.map((p, i) => (
                <li key={p.t} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: PH.marino }}><p.icon className="h-5 w-5" aria-hidden /></span>
                  <span>
                    <b className="block font-display text-foreground">{i + 1}. {p.t}</b>
                    <span className="text-sm text-muted-foreground">{p.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/convenio/$programa" params={{ programa: "purahei" }} className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-white" style={{ background: PH.rojo }}>
                <FileSignature className="h-5 w-5" aria-hidden /> Quiero sumarme: firmar en línea
              </Link>
              <a href={sumarme} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-primary ring-1 ring-border">
                <MessageCircle className="h-5 w-5" aria-hidden /> Tengo dudas
              </a>
              <Link to="/libreria" className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-primary ring-1 ring-border">
                <BookOpenText className="h-5 w-5" aria-hidden /> Ver la Librería
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
