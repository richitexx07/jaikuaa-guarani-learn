/**
 * Piezas visuales del Mercado Jaikuaa: cabecera con buscador y carrito, estrellas, tarjeta de producto
 * y los íconos de cada categoría. Colores de la casa (azul noche, dorado, rojo y papel).
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft, BookOpen, Building2, GraduationCap, Languages, MapPinned, Music, Package, Palette, PlayCircle, Presentation, Search,
  ShoppingBag, Star, Store, UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CATEGORIA_NOMBRE, type Categoria, type ItemMercado } from "@/lib/mercado";
import { formatoGs } from "@/lib/pagopar";
import { LIB_COLORES as C } from "@/components/libreria/arte";
import { useCarrito } from "@/components/mercado/carrito";

export const MC = C;

export const ICONO_CATEGORIA: Record<Categoria, typeof BookOpen> = {
  libros: BookOpen,
  modulos: GraduationCap,
  cursos: PlayCircle,
  artesania: Palette,
  musica: Music,
  clases: Presentation,
  traducciones: Languages,
  experiencias: MapPinned,
  empresas: Building2,
  otros: Package,
};

export function CabeceraMercado({ busqueda, onBuscar }: { busqueda?: string; onBuscar?: (t: string) => void }) {
  const { cantidad } = useCarrito();
  const navigate = useNavigate();
  const [texto, setTexto] = useState(busqueda ?? "");
  return (
    <header className="mercado-claro sticky top-0 z-30 shadow-md" style={{ background: C.noche }}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6">
        <Link
          to="/"
          className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 text-sm font-bold text-white hover:bg-white/20"
          aria-label="Volver a Jaikuaa"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Jaikuaa
        </Link>
        <Link to="/mercado" className="flex shrink-0 items-center gap-2" aria-label="Mercado Jaikuaa, inicio">
          <BrandLogo withWordmark={false} />
          <span className="hidden font-display text-lg font-bold leading-none text-white sm:block">
            Mercado<span className="block text-xs font-semibold" style={{ color: C.dorado }}>Jaikuaa</span>
          </span>
        </Link>
        <form
          role="search"
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (onBuscar) onBuscar(texto);
            else void navigate({ to: "/mercado", search: { q: texto } });
          }}
        >
          <label className="sr-only" htmlFor="buscar-mercado">Buscar en el Mercado</label>
          <input
            id="buscar-mercado"
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              onBuscar?.(e.target.value);
            }}
            placeholder="Buscar en el Mercado"
            className="h-11 w-full rounded-full border-0 bg-white pl-4 pr-11 text-base text-[#1B2433] shadow-inner"
          />
          <button type="submit" aria-label="Buscar" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full" style={{ background: C.dorado, color: C.noche }}>
            <Search className="h-4 w-4" />
          </button>
        </form>
        <Link to="/mis-compras" className="hidden items-center gap-1 text-sm font-semibold text-white/90 hover:text-white sm:flex">
          <UserRound className="h-5 w-5" /> Mis compras
        </Link>
        <Link to="/mercado/carrito" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-white hover:bg-white/10" aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`}>
          <ShoppingBag className="h-6 w-6" />
          {cantidad > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold" style={{ background: C.rojo, color: "#fff" }}>
              {cantidad}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export function Estrellas({ valor, cantidad, tamano = "sm" }: { valor: number | null; cantidad?: number; tamano?: "sm" | "lg" }) {
  if (valor === null) return cantidad === undefined ? null : <span className="text-xs text-muted-foreground">Sin opiniones todavía</span>;
  const px = tamano === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${valor} de 5 estrellas${cantidad !== undefined ? `, ${cantidad} opiniones` : ""}`}>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={px} style={{ color: C.dorado, fill: n <= Math.round(valor) ? C.dorado : "transparent" }} />
        ))}
      </span>
      <span className={tamano === "lg" ? "text-base font-bold text-foreground" : "text-xs font-semibold text-foreground"}>{valor.toFixed(1)}</span>
      {cantidad !== undefined && <span className="text-xs text-muted-foreground">({cantidad})</span>}
    </span>
  );
}

export function Precio({ gs, antes, grande = false }: { gs: number | null; antes?: number | null; grande?: boolean }) {
  if (gs === null) return <span className={`font-bold ${grande ? "text-xl" : "text-sm"}`} style={{ color: C.azul }}>A cotizar</span>;
  const desc = antes && antes > gs ? Math.round(((antes - gs) / antes) * 100) : 0;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      {desc > 0 && <span className={`text-muted-foreground line-through ${grande ? "text-sm" : "text-xs"}`}>{formatoGs(antes!)}</span>}
      <span className={`font-display font-bold ${grande ? "text-3xl" : "text-lg"}`} style={{ color: C.tinta }}>{formatoGs(gs)}</span>
      {desc > 0 && <span className="text-xs font-bold text-emerald-700">{desc}% menos</span>}
    </span>
  );
}

export function TarjetaItem({ item, extra }: { item: ItemMercado; extra?: ReactNode }) {
  const Icono = ICONO_CATEGORIA[item.categoria];
  return (
    <Link
      to="/mercado/$tipo/$id"
      params={{ tipo: item.tipo, id: item.id }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
    >
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: C.azul }}>
        {item.foto ? (
          <img src={item.foto} alt="" loading="lazy" className={`h-full w-full ${item.tipo === "obra" ? "object-contain p-3" : "object-cover"} transition group-hover:scale-[1.03]`} />
        ) : (
          <div className="flex h-full flex-col justify-between p-3 text-white">
            <Icono className="h-7 w-7" style={{ color: C.dorado }} aria-hidden />
            <p className="line-clamp-4 font-display text-base font-bold leading-tight">{item.titulo}</p>
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#1B2433] shadow">
          <Icono className="h-3 w-3" aria-hidden /> {CATEGORIA_NOMBRE[item.categoria]}
        </span>
        {item.agotado && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-bold text-white">Agotado</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.titulo}</p>
        <Estrellas valor={item.estrellas} cantidad={item.estrellas === null ? undefined : item.resenas} />
        <div className="mt-auto pt-1">
          <Precio gs={item.precioGs} antes={item.precioAnteriorGs} />
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Store className="h-3 w-3 shrink-0" aria-hidden /> {item.vendedor}
            {item.ciudad ? ` · ${item.ciudad}` : ""}
          </p>
          {extra}
        </div>
      </div>
    </Link>
  );
}

export function Grilla({ items }: { items: ItemMercado[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((i) => (
        <li key={`${i.tipo}:${i.id}`}>
          <TarjetaItem item={i} />
        </li>
      ))}
    </ul>
  );
}

/** Fila horizontal deslizable (destacados, novedades…). */
export function Fila({ titulo, items, accion }: { titulo: string; items: ItemMercado[]; accion?: ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8" aria-label={titulo}>
      <div className="flex items-end justify-between gap-2 px-1">
        <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: C.tinta }}>{titulo}</h2>
        {accion}
      </div>
      <ul className="-mx-3 mt-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6">
        {items.map((i) => (
          <li key={`${i.tipo}:${i.id}`} className="w-40 shrink-0 snap-start sm:w-48">
            <TarjetaItem item={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
