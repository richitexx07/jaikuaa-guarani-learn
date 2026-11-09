/** En el panel: acceso directo a «Mis libros», solo si la persona ya tiene algún libro. */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ChevronRight } from "lucide-react";
import { misLibros } from "@/lib/libros.functions";

export function MisLibrosAcceso() {
  const cargar = useServerFn(misLibros);
  const { data } = useQuery({ queryKey: ["mis-libros"], queryFn: () => cargar(), staleTime: 5 * 60 * 1000, retry: false });
  const n = data?.libros.length ?? 0;
  if (n === 0) return null;
  return (
    <Link
      to="/mis-libros"
      className="mt-4 flex items-center gap-3 rounded-2xl bg-[#1E3A5F] px-4 py-3 text-white shadow-elegant transition hover:brightness-110"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F2C230] text-[#1B2A44]">
        <BookOpen className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold">Mis libros</span>
        <span className="block text-xs text-white/75">
          {n} {n === 1 ? "libro" : "libros"} para leer y escuchar
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-80" />
    </Link>
  );
}
