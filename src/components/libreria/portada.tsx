import { BookOpen } from "lucide-react";
import type { LibroCard } from "@/lib/libros.functions";

/** La portada de un libro de la Librería; si todavía no tiene imagen, una tapa azul con el título. */
export function Portada({ libro, className = "" }: { libro: Pick<LibroCard, "titulo" | "autor" | "portada">; className?: string }) {
  if (libro.portada) {
    return <img src={libro.portada} alt={`Portada de ${libro.titulo}`} className={`aspect-[3/4] w-full rounded-xl object-cover shadow-md ${className}`} loading="lazy" draggable={false} />;
  }
  return (
    <div className={`flex aspect-[3/4] w-full flex-col justify-between rounded-xl bg-[#1E3A5F] p-3 text-white shadow-md ${className}`}>
      <BookOpen className="h-6 w-6 text-[#F2C230]" aria-hidden />
      <div>
        <p className="line-clamp-4 font-display text-base font-bold leading-tight">{libro.titulo}</p>
        {libro.autor && <p className="mt-1 line-clamp-2 text-xs text-white/70">{libro.autor}</p>}
      </div>
    </div>
  );
}
