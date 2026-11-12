/**
 * Piezas compartidas de Tembiapo Jaikuaa: el ícono de cada oficio, su tarjeta y el ejemplo de ficha
 * que ve un artesano antes de sumarse (sin datos inventados: solo el lugar de cada cosa).
 */
import { Link } from "@tanstack/react-router";
import { Amphora, Axe, Feather, Footprints, Gem, ImageIcon, MapPin, MessageCircle, Scissors, Shirt, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Nanduti } from "@/components/libreria/arte";
import { TB, type Oficio } from "@/lib/tembiapo";

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
