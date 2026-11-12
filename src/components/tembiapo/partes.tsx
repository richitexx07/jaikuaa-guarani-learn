/**
 * Piezas compartidas de Tembiapo Jaikuaa: el ícono de cada oficio, su tarjeta y el ejemplo de ficha
 * que ve un artesano antes de sumarse (sin datos inventados: solo el lugar de cada cosa).
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Amphora, Award, Axe, Feather, Footprints, Gem, ImageIcon, Loader2, MapPin, MessageCircle, Pause, Route as RutaIcon, Scissors, Shirt, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Nanduti } from "@/components/libreria/arte";
import { enlaceWhatsappArtesano, nombreOficio, TB, type Oficio } from "@/lib/tembiapo";
import type { ArtesanoCard, RutaCard, Termino } from "@/lib/tembiapo.functions";

const ICONO: Record<string, LucideIcon> = {
  "ao-poi": Shirt,
  filigrana: Gem,
  ceramica: Amphora,
  poncho: Scissors,
  tallado: Axe,
  cuero: Footprints,
  indigena: Feather,
};

/** Ñandutí en trazo grueso, para que se lea en tamaño ícono (el dibujo fino queda para los fondos). */
function NandutiIcono({ className = "" }: { className?: string }) {
  const rayos = Array.from({ length: 12 }, (_, k) => (k / 12) * Math.PI * 2);
  return (
    <svg viewBox="-12 -12 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
      <circle r={10} />
      <circle r={6} />
      <circle r={2.2} />
      {rayos.map((a, k) => <line key={k} x1={Math.cos(a) * 2.2} y1={Math.sin(a) * 2.2} x2={Math.cos(a) * 10} y2={Math.sin(a) * 10} strokeWidth={1} />)}
    </svg>
  );
}

export function IconoOficio({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  if (slug === "nanduti") return <NandutiIcono className={className} />;
  const I = ICONO[slug] ?? Feather;
  return <I className={className} aria-hidden />;
}

export function TarjetaOficio({ o }: { o: Oficio }) {
  return (
    <Link
      to="/tembiapo/oficio/$slug"
      params={{ slug: o.slug }}
      className="group flex h-full flex-col rounded-3xl p-4 ring-1 transition active:scale-[.99] hover:shadow-elegant"
      style={{ background: TB.lino, borderColor: TB.hilo, ["--tw-ring-color" as string]: TB.hilo }}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: TB.marino }}>
        <IconoOficio slug={o.slug} className="h-7 w-7" />
      </span>
      <b className="mt-3 font-display text-lg leading-tight" style={{ color: TB.noche }}>{o.nombre}</b>
      <span className="mt-1 text-sm text-muted-foreground">{o.resumen}</span>
      {o.lugares.length > 0 && (
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold" style={{ color: TB.rojo }}>
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {o.lugares.join(" · ")}
        </span>
      )}
    </Link>
  );
}

/** Cómo se va a ver la ficha de un artesano. Todo es un lugar a completar: no hay personas ni palabras inventadas. */
export function FichaEjemplo() {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-elegant ring-1 ring-border" aria-label="Ejemplo de ficha de artesano">
      <div className="relative grid aspect-[4/3] place-items-center" style={{ background: `linear-gradient(160deg, ${TB.marino}, ${TB.noche})` }}>
        <Nanduti className="absolute h-56 w-56 text-white/15" />
        <span className="relative rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">Tu retrato, en tu taller</span>
      </div>
      <div className="p-4">
        <p className="font-display text-xl font-bold text-foreground">Tu nombre</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" aria-hidden /> Tu oficio · tu ciudad</p>
        <p className="mt-3 text-sm text-muted-foreground">Tu historia, contada como vos quieras: cómo aprendiste, qué hacés y qué te enorgullece de tu trabajo.</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Tus piezas</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="grid aspect-square place-items-center rounded-xl" style={{ background: TB.lino }}>
              <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Palabras de tu oficio</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: TB.lino, color: TB.marino }}>
              <Volume2 className="h-3.5 w-3.5" aria-hidden /> con tu voz
            </span>
          ))}
        </div>
        <span className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-display font-bold text-white" style={{ background: TB.rojo }}>
          <MessageCircle className="h-5 w-5" aria-hidden /> Escribile por WhatsApp
        </span>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Te escriben directo. Jaikuaa no cobra comisión por tus ventas.</p>
      </div>
    </div>
  );
}

/** Retrato del artesano; sin foto, un ñandutí con su inicial. */
export function FotoArtesano({ src, nombre, className = "" }: { src: string | null; nombre: string; className?: string }) {
  if (src) return <img src={src} alt={`Retrato de ${nombre}`} className={`object-cover ${className}`} loading="lazy" />;
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${TB.marino}, ${TB.noche})` }} role="img" aria-label={nombre}>
      <Nanduti className="absolute h-[140%] w-[140%] text-white/10" />
      <span className="relative font-display text-4xl font-bold text-white">{nombre.trim().charAt(0).toUpperCase() || "?"}</span>
    </div>
  );
}

/** Sello «Maestro artesano»: solo con reconocimiento del Instituto Paraguayo de Artesanía. */
export function SelloMaestro({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${className}`} style={{ background: TB.rojo }}>
      <Award className="h-3.5 w-3.5" aria-hidden /> Maestro artesano
    </span>
  );
}

export function TarjetaArtesano({ a }: { a: ArtesanoCard }) {
  return (
    <Link to="/tembiapo/maestro/$slug" params={{ slug: a.slug }} className="group block overflow-hidden rounded-3xl bg-card ring-1 ring-border transition active:scale-[.99] hover:shadow-elegant">
      <div className="relative">
        <FotoArtesano src={a.foto} nombre={a.nombre} className="aspect-[4/5] w-full" />
        {a.maestro && <SelloMaestro className="absolute left-2 top-2" />}
      </div>
      <div className="p-3">
        <b className="block truncate font-display text-lg leading-tight text-foreground">{a.nombre}</b>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <IconoOficio slug={a.oficio} className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{nombreOficio(a.oficio)}{a.ciudad ? ` · ${a.ciudad}` : ""}</span>
        </span>
      </div>
    </Link>
  );
}

export function TarjetaRuta({ r }: { r: RutaCard }) {
  return (
    <Link to="/tembiapo/ruta/$slug" params={{ slug: r.slug }} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/15 transition hover:bg-white/10">
      {r.foto
        ? <img src={r.foto} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
        : <span className="relative grid aspect-[16/9] place-items-center overflow-hidden" style={{ background: TB.noche }}><Nanduti className="absolute h-48 w-48 text-white/15" /><RutaIcon className="relative h-8 w-8 text-white/70" aria-hidden /></span>}
      <span className="flex flex-1 flex-col p-4">
        <b className="font-display text-xl text-white">{r.nombre}</b>
        {r.lugares.length > 0 && <span className="mt-1 text-sm text-white/75">{r.lugares.join(" → ")}</span>}
        {r.auspiciante && <span className="mt-auto pt-3 text-xs text-white/60">Con el apoyo de {r.auspiciante}</span>}
      </span>
    </Link>
  );
}

/** Botón para escribirle al artesano. Jaikuaa no intermedia la venta. */
export function BotonWhatsappArtesano({ numero, nombre, contacto, pieza, className = "" }: { numero: string; nombre: string; contacto?: string; pieza?: string; className?: string }) {
  return (
    <div className={className}>
      <a href={enlaceWhatsappArtesano(numero, nombre, pieza)} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 font-display font-bold text-white" style={{ background: TB.rojo }}>
        <MessageCircle className="h-5 w-5" aria-hidden /> {pieza ? "Consultar por esta pieza" : "Escribile por WhatsApp"}
      </a>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        {contacto ? `Atiende ${contacto}. ` : ""}Le escribís directo. Jaikuaa no cobra comisión por sus ventas.
      </p>
    </div>
  );
}

/** Una palabra del oficio con la voz del artesano (si hay grabación). Nunca voz sintética. */
function PalabraOficio({ t }: { t: Termino }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [estado, setEstado] = useState<"quieto" | "cargando" | "sonando">("quieto");
  useEffect(() => () => ref.current?.pause(), []);
  const tocar = () => {
    if (!t.audio) return;
    if (estado === "sonando") { ref.current?.pause(); setEstado("quieto"); return; }
    const a = ref.current ?? new Audio(t.audio);
    ref.current = a;
    a.onended = () => setEstado("quieto");
    a.onerror = () => setEstado("quieto");
    setEstado("cargando");
    a.currentTime = 0;
    a.play().then(() => setEstado("sonando")).catch(() => setEstado("quieto"));
  };
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      {t.audio ? (
        <button type="button" onClick={tocar} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: TB.marino }} aria-label={`Escuchar «${t.termino}»`}>
          {estado === "cargando" ? <Loader2 className="h-5 w-5 animate-spin" /> : estado === "sonando" ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: TB.lino, color: TB.marino }} aria-hidden><Volume2 className="h-5 w-5 opacity-40" /></span>
      )}
      <span className="min-w-0">
        <b className="block font-display text-lg leading-tight" style={{ color: TB.noche }} lang="gn">{t.termino}</b>
        <span className="text-sm text-muted-foreground">{t.significado}</span>
      </span>
    </li>
  );
}

export function ListaPalabras({ palabras }: { palabras: Termino[] }) {
  return (
    <>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{palabras.map((t) => <PalabraOficio key={t.id} t={t} />)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">Palabras revisadas por docentes especialistas. Las grabaciones son la voz de los propios artesanos.</p>
    </>
  );
}
