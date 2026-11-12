/**
 * Si alguien empezó a llenar un convenio (Purahéi o Librería) y fue a crear su cuenta, al volver al panel
 * le recordamos que le falta firmar, con un botón que lo lleva de vuelta con todo lo que ya llenó.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSignature } from "lucide-react";
import { hayBorrador, NOMBRE_PROGRAMA, type Programa } from "@/lib/convenios";

export function ConvenioPendiente() {
  const [p, setP] = useState<Programa | null>(null);
  useEffect(() => { setP(hayBorrador()); }, []);
  if (!p) return null;
  return (
    <Link
      to="/convenio/$programa"
      params={{ programa: p }}
      className="mt-4 flex min-h-16 items-center gap-3 rounded-2xl bg-[#1E3A5F] px-4 py-3 text-white shadow-lg transition active:scale-[.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F6C445] text-[#0F2038]"><FileSignature className="h-5 w-5" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <b className="block font-display text-base leading-tight">Te falta firmar tu convenio</b>
        <span className="text-sm text-white/80">{NOMBRE_PROGRAMA[p]}: lo que llenaste quedó guardado.</span>
      </span>
      <span className="shrink-0 rounded-full bg-[#F6C445] px-3 py-1.5 text-sm font-bold text-[#0F2038]">Firmar</span>
    </Link>
  );
}
