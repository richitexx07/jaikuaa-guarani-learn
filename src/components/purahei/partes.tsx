/**
 * Piezas compartidas de Purahéi Jaikuaa (la vitrina de artistas): colores de la casa,
 * la foto del artista con su respaldo, y el botón de WhatsApp directo.
 */
import { MessageCircle, Music2 } from "lucide-react";
import { enlaceWhatsapp, NOMBRE_ESTILO, type Estilo } from "@/lib/purahei";

/** Azul marino y rojo de Jaikuaa, con el dorado del escenario. */
export const PH = { marino: "#1E3A5F", noche: "#0F2038", rojo: "#C8102E", dorado: "#F6C445", papel: "#FFF8EA" };

export function FotoArtista({ src, nombre, className = "" }: { src: string | null; nombre: string; className?: string }) {
  if (src) return <img src={src} alt={`Foto de ${nombre}`} className={`object-cover ${className}`} loading="lazy" />;
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`grid place-items-center ${className}`} style={{ background: `linear-gradient(160deg, ${PH.marino}, ${PH.noche})` }} role="img" aria-label={nombre}>
      <span className="font-display text-5xl font-bold" style={{ color: PH.dorado }}>{inicial}</span>
    </div>
  );
}

export function ChipEstilo({ estilo }: { estilo: Estilo }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      <Music2 className="h-3 w-3" aria-hidden /> {NOMBRE_ESTILO[estilo]}
    </span>
  );
}

/** Contratación directa: el mensaje va al artista o a su representante. Jaikuaa no cobra comisión. */
export function BotonWhatsapp({ numero, artista, contacto, className = "" }: { numero: string; artista: string; contacto?: string; className?: string }) {
  return (
    <div className={className}>
      <a
        href={enlaceWhatsapp(numero, artista)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 font-display text-lg font-bold text-white shadow-lg transition active:scale-[.98]"
        style={{ background: PH.rojo }}
      >
        <MessageCircle className="h-5 w-5" aria-hidden /> Contratar por WhatsApp
      </a>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {contacto ? `Te atiende ${contacto}. ` : "Hablás directo con el artista. "}Jaikuaa no cobra comisión por las contrataciones.
      </p>
    </div>
  );
}
