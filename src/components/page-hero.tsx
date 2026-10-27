import type { ReactNode } from "react";
import { NandutiDisc } from "@/components/nanduti-disc";

/**
 * Cabecera de sección con Jai: en el celular, Jai chico a la izquierda y el título al lado,
 * para que el contenido aparezca enseguida; en pantallas anchas, todo más grande.
 */
export function PageHero({
  img,
  imgAlt,
  title,
  eyebrow,
  children,
}: {
  img: string;
  imgAlt: string;
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="nanduti-bg relative flex items-center gap-3 overflow-hidden rounded-3xl border border-border bg-card p-3 pr-4 shadow-elegant sm:gap-5 sm:p-5">
      <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
        <NandutiDisc className="absolute inset-0 h-full w-full text-primary" />
        <img src={img} alt={imgAlt} className="relative h-full w-full object-contain drop-shadow-lg" />
      </div>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-semibold text-accent">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">{title}</h1>
        {children && <div className="mt-1 text-sm leading-snug text-muted-foreground sm:text-base">{children}</div>}
      </div>
    </div>
  );
}
